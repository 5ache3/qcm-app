"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateQuestionScore, getQuestionStatus } from "@/lib/scoring"

const TEST_DURATION_SECONDS = 20 * 60 // 20 minutes

export async function startTest(subjectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Resume existing in-progress test if any
  const { data: existing } = await supabase
    .from("tests")
    .select("id, started_at")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let testId: string
  let startedAt: string

  if (existing) {
    testId = existing.id
    startedAt = existing.started_at
  } else {
    // Pick 20 random questions
    const { data: allQuestions } = await supabase
      .from("questions")
      .select("id")
      .eq("subject_id", subjectId)

    if (!allQuestions || allQuestions.length < 20) {
      throw new Error("Not enough questions")
    }

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 20)

    const { data: test, error } = await supabase
      .from("tests")
      .insert({ user_id: user.id, subject_id: subjectId, status: "in_progress" })
      .select("id, started_at")
      .single()

    if (error || !test) throw new Error("Failed to create test")

    testId = test.id
    startedAt = test.started_at

    await supabase.from("test_questions").insert(
      shuffled.map((q, i) => ({ test_id: testId, question_id: q.id, position: i + 1 }))
    )
  }

  // Load the 20 questions with options
  const { data: testQuestions } = await supabase
    .from("test_questions")
    .select(`
      position,
      question_id,
      questions (
        id,
        question_text,
        explanation,
        difficulty,
        answer_options (
          id,
          option_text,
          is_correct,
          position
        )
      )
    `)
    .eq("test_id", testId)
    .order("position")

  const questions = (testQuestions ?? []).map((tq) => {
    const q = tq.questions as any
    return {
      id: q.id as string,
      question_text: q.question_text as string,
      explanation: q.explanation as string | null,
      difficulty: q.difficulty as string | null,
      answer_options: ([...q.answer_options] as any[])
        .sort((a, b) => a.position - b.position)
        .map((o) => ({
          id: o.id as string,
          option_text: o.option_text as string,
          is_correct: o.is_correct as boolean,
          position: o.position as number,
        })),
    }
  })

  return { testId, startedAt, questions, durationSeconds: TEST_DURATION_SECONDS }
}

export async function submitTest(
  testId: string,
  answers: { questionId: string; selectedOptionIds: string[] }[],
  elapsedSeconds: number,
  expired: boolean
) {
  const supabase = await createClient()

  // Load test_questions with correct answers
  const { data: testQuestions } = await supabase
    .from("test_questions")
    .select(`
      id,
      question_id,
      questions!inner (
        answer_options ( id, is_correct )
      )
    `)
    .eq("test_id", testId)

  if (!testQuestions) throw new Error("Test not found")

  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionIds]))

  const testAnswerRows = testQuestions.map((tq) => {
    const selected = answerMap.get(tq.question_id) ?? []
    const correctIds = (tq.questions as any).answer_options
      .filter((o: any) => o.is_correct)
      .map((o: any) => o.id as string)

    const score = calculateQuestionScore(selected, correctIds)
    const status = getQuestionStatus(selected, correctIds)

    return {
      test_id: testId,
      question_id: tq.question_id,
      selected_option_ids: selected,
      score,
      status,
      answered_at: selected.length > 0 ? new Date().toISOString() : null,
      tqId: tq.id,
    }
  })

  // Batch-save answers
  const { error: ansErr } = await supabase.from("test_answers").insert(
    testAnswerRows.map(({ tqId: _, ...row }) => row)
  )
  if (ansErr) throw new Error("Failed to save answers")

  // Update per-question scores on test_questions
  await Promise.all(
    testAnswerRows.map((row) =>
      supabase
        .from("test_questions")
        .update({ score: row.score })
        .eq("id", row.tqId)
    )
  )

  // Compute totals
  const totalRaw = testAnswerRows.reduce((sum, r) => sum + r.score, 0)
  const percentage = (totalRaw / testAnswerRows.length) * 100

  await supabase.from("tests").update({
    status: expired ? "expired" : "completed",
    completed_at: new Date().toISOString(),
    duration_seconds: elapsedSeconds,
    score: Math.round(totalRaw * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  }).eq("id", testId)

  return { testId, percentage: Math.round(percentage * 100) / 100 }
}
