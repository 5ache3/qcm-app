"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ParsedQuestion } from "@/app/admin/questions/parseCSV"

async function getVerifiedSupabase(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("tutor_id", user.id)
    .single()
  return cls ? supabase : null
}

export async function getTutorQuestionsForSubject(subjectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("questions")
    .select(`
      id, question_text, explanation, difficulty, lesson_id, created_at,
      lesson:lessons(name),
      answer_options ( id, option_text, is_correct, position )
    `)
    .eq("subject_id", subjectId)
    .order("created_at")
  return data ?? []
}

export async function getTutorLessonsForQuestions(subjectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select("id, name")
    .eq("subject_id", subjectId)
    .order("position")
  return data ?? []
}

export async function createTutorQuestion(
  classId: string,
  subjectId: string,
  fields: {
    question_text: string
    explanation: string | null
    difficulty: string | null
    lesson_id?: string | null
    options: { option_text: string; is_correct: boolean }[]
  }
) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      subject_id: subjectId,
      question_text: fields.question_text,
      explanation: fields.explanation,
      difficulty: fields.difficulty,
      lesson_id: fields.lesson_id ?? null,
    })
    .select("id")
    .single()
  if (error || !question) return { error: error?.message ?? "Erreur de création" }

  await supabase.from("answer_options").insert(
    fields.options.map((o, i) => ({
      question_id: question.id,
      option_text: o.option_text,
      is_correct: o.is_correct,
      position: i,
    }))
  )
  return { success: true }
}

export async function updateTutorQuestion(
  classId: string,
  questionId: string,
  fields: { question_text: string; explanation: string | null; difficulty: string | null; lesson_id?: string | null }
) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase
    .from("questions")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", questionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTutorQuestion(classId: string, questionId: string) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase.from("questions").delete().eq("id", questionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateTutorAnswerOption(
  classId: string,
  optionId: string,
  fields: { option_text: string; is_correct: boolean }
) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase.from("answer_options").update(fields).eq("id", optionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTutorAnswerOption(classId: string, optionId: string) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase.from("answer_options").delete().eq("id", optionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function addTutorAnswerOption(
  classId: string,
  questionId: string,
  fields: { option_text: string; is_correct: boolean; position: number }
) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase
    .from("answer_options")
    .insert({ question_id: questionId, ...fields })
  if (error) return { error: error.message }
  return { success: true }
}

export async function importTutorQuestions(
  classId: string,
  subjectId: string,
  questions: ParsedQuestion[]
) {
  const supabase = await getVerifiedSupabase(classId)
  if (!supabase) return { error: "Non autorisé" }

  // Resolve lesson names → ids, creating missing lessons as needed
  const lessonNameToId = new Map<string, string>()
  const uniqueLessonNames = [...new Set(
    questions.map((q) => q.lesson).filter((l): l is string => l !== null)
  )]

  if (uniqueLessonNames.length > 0) {
    const { data: existing } = await supabase
      .from("lessons")
      .select("id, name")
      .eq("subject_id", subjectId)

    for (const l of existing ?? []) {
      lessonNameToId.set(l.name.toLowerCase(), l.id)
    }

    const existingCount = (existing ?? []).length
    for (let i = 0; i < uniqueLessonNames.length; i++) {
      const name = uniqueLessonNames[i]
      if (lessonNameToId.has(name.toLowerCase())) continue
      const { data: created } = await supabase
        .from("lessons")
        .insert({ subject_id: subjectId, name, position: existingCount + i })
        .select("id")
        .single()
      if (created) lessonNameToId.set(name.toLowerCase(), created.id)
    }
  }

  let imported = 0
  for (const q of questions) {
    const lesson_id = q.lesson ? (lessonNameToId.get(q.lesson.toLowerCase()) ?? null) : null

    const { data: question, error } = await supabase
      .from("questions")
      .insert({
        subject_id: subjectId,
        question_text: q.question_text,
        explanation: q.explanation,
        difficulty: q.difficulty,
        lesson_id,
      })
      .select("id")
      .single()

    if (error || !question) continue

    await supabase.from("answer_options").insert(
      q.options.map((o) => ({
        question_id: question.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
        position: o.position,
      }))
    )
    imported++
  }

  revalidatePath(`/tutor/classes/${classId}/questions`)
  return { imported }
}
