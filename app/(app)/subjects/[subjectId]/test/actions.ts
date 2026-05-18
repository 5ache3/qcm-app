"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateQuestionScore, getQuestionStatus } from "@/lib/scoring"
import type { QuestionStatus } from "@/lib/scoring"

const TEST_DURATION_SECONDS = 20 * 60 // 20 minutes

export async function startTest(subjectId: string, lessonId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Resume existing in-progress test if any (scoped to subject or lesson)
  let existingQuery = supabase
    .from("tests")
    .select("id, started_at")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)

  if (lessonId) {
    existingQuery = existingQuery.eq("lesson_id", lessonId) as typeof existingQuery
  } else {
    existingQuery = existingQuery.is("lesson_id", null) as typeof existingQuery
  }

  const { data: existing } = await existingQuery.maybeSingle()

  let testId!: string
  let startedAt!: string
  let isResume = false

  if (existing) {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(existing.started_at).getTime()) / 1000
    )
    if (elapsedSeconds < TEST_DURATION_SECONDS) {
      // Still within time — resume it
      testId = existing.id
      startedAt = existing.started_at
      isResume = true
    } else {
      // Already expired — mark it and create a fresh one
      await supabase
        .from("tests")
        .update({
          status: "expired",
          completed_at: new Date().toISOString(),
          duration_seconds: elapsedSeconds,
        })
        .eq("id", existing.id)
    }
  }

  if (!isResume) {
    // Pick 20 random questions (from lesson if lessonId provided, otherwise from subject)
    let questionsQuery = supabase.from("questions").select("id").eq("subject_id", subjectId)
    if (lessonId) {
      questionsQuery = questionsQuery.eq("lesson_id", lessonId) as typeof questionsQuery
    }
    const { data: allQuestions } = await questionsQuery

    if (!allQuestions || allQuestions.length < 20) {
      throw new Error("Not enough questions")
    }

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 20)

    const { data: maxTest } = await supabase
      .from("tests")
      .select("test_number")
      .eq("user_id", user.id)
      .eq("subject_id", subjectId)
      .order("test_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const testNumber = (maxTest?.test_number ?? 0) + 1

    const { data: test, error } = await supabase
      .from("tests")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        lesson_id: lessonId ?? null,
        status: "in_progress",
        test_number: testNumber,
      })
      .select("id, started_at")
      .single()

    if (error || !test) throw new Error("Failed to create test")

    testId = test.id!
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
        lesson_id,
        lesson:lessons(name),
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
      lesson_name: (q.lesson as { name: string } | null)?.name ?? null,
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

  // Load saved answers for a resumed test
  let savedAnswers: { questionId: string; selectedOptionIds: string[]; score: number; status: QuestionStatus }[] = []
  if (isResume) {
    const { data: existing } = await supabase
      .from("test_answers")
      .select("question_id, selected_option_ids, score, status")
      .eq("test_id", testId)

    savedAnswers = (existing ?? []).map((a) => ({
      questionId: a.question_id as string,
      selectedOptionIds: a.selected_option_ids as string[],
      score: a.score as number,
      status: a.status as QuestionStatus,
    }))
  }

  return { testId, startedAt, questions, durationSeconds: TEST_DURATION_SECONDS, savedAnswers }
}

export async function saveTestAnswer(
  testId: string,
  questionId: string,
  selectedOptionIds: string[],
  score: number,
  status: string,
) {
  const supabase = await createClient()
  // Delete previous save for this question (in case of re-confirm after page reload edge case)
  await supabase
    .from("test_answers")
    .delete()
    .eq("test_id", testId)
    .eq("question_id", questionId)

  await supabase.from("test_answers").insert({
    test_id: testId,
    question_id: questionId,
    selected_option_ids: selectedOptionIds,
    score,
    status,
    answered_at: new Date().toISOString(),
  })
}

export async function deleteTest(testId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  // Delete child rows first in case FK cascade is not set
  await supabase.from("test_answers").delete().eq("test_id", testId)
  await supabase.from("test_questions").delete().eq("test_id", testId)

  const query = supabase.from("tests").delete().eq("id", testId)
  const { error } = isAdmin ? await query : await query.eq("user_id", user.id)

  return { success: !error }
}

export async function retakeTest(originalTestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: original } = await supabase
    .from("tests")
    .select("subject_id, lesson_id")
    .eq("id", originalTestId)
    .eq("user_id", user.id)
    .single()

  if (!original) throw new Error("Test not found")
  const lessonId = original.lesson_id as string | null

  const { data: originalQuestions } = await supabase
    .from("test_questions")
    .select("question_id, position")
    .eq("test_id", originalTestId)
    .order("position")

  if (!originalQuestions?.length) throw new Error("No questions found")

  // Expire any existing in-progress test for same scope (subject or lesson)
  let expireQuery = supabase
    .from("tests")
    .update({ status: "expired", completed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("subject_id", original.subject_id)
    .eq("status", "in_progress")

  if (lessonId) {
    expireQuery = expireQuery.eq("lesson_id", lessonId) as typeof expireQuery
  } else {
    expireQuery = expireQuery.is("lesson_id", null) as typeof expireQuery
  }
  await expireQuery

  const { data: maxTest } = await supabase
    .from("tests")
    .select("test_number")
    .eq("user_id", user.id)
    .eq("subject_id", original.subject_id)
    .order("test_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const testNumber = (maxTest?.test_number ?? 0) + 1

  const { data: newTest, error } = await supabase
    .from("tests")
    .insert({
      user_id: user.id,
      subject_id: original.subject_id,
      lesson_id: lessonId,
      status: "in_progress",
      retake_of: originalTestId,
      test_number: testNumber,
    })
    .select("id")
    .single()

  if (error || !newTest) throw new Error("Failed to create retake")

  await supabase.from("test_questions").insert(
    originalQuestions.map((q) => ({
      test_id: newTest.id,
      question_id: q.question_id,
      position: q.position,
    }))
  )

  return { subjectId: original.subject_id as string, lessonId }
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

  // Remove any incremental saves then insert final answers
  await supabase.from("test_answers").delete().eq("test_id", testId)
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
