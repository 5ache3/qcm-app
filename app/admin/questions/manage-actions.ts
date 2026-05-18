"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getQuestionsForSubject(subjectId: string) {
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

export async function getLessonsForSubjectAdmin(subjectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select("id, name")
    .eq("subject_id", subjectId)
    .order("position")
  return data ?? []
}

export async function updateQuestionLesson(questionId: string, lessonId: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("questions")
    .update({ lesson_id: lessonId, updated_at: new Date().toISOString() })
    .eq("id", questionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateQuestion(
  questionId: string,
  fields: { question_text: string; explanation: string | null; difficulty: string | null; lesson_id?: string | null }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("questions")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", questionId)
  if (error) return { error: error.message }
  revalidatePath("/admin/questions")
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("questions").delete().eq("id", questionId)
  if (error) return { error: error.message }
  revalidatePath("/admin/questions")
  return { success: true }
}

export async function updateAnswerOption(
  optionId: string,
  fields: { option_text: string; is_correct: boolean }
) {
  const supabase = await createClient()
  const { error } = await supabase.from("answer_options").update(fields).eq("id", optionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAnswerOption(optionId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("answer_options").delete().eq("id", optionId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function addAnswerOption(
  questionId: string,
  fields: { option_text: string; is_correct: boolean; position: number }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("answer_options")
    .insert({ question_id: questionId, ...fields })
  if (error) return { error: error.message }
  return { success: true }
}

export async function createQuestion(
  subjectId: string,
  fields: {
    question_text: string
    explanation: string | null
    difficulty: string | null
    lesson_id?: string | null
    options: { option_text: string; is_correct: boolean }[]
  }
) {
  const supabase = await createClient()
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
  if (error || !question) return { error: error?.message ?? "Failed to create question" }

  await supabase.from("answer_options").insert(
    fields.options.map((o, i) => ({
      question_id: question.id,
      option_text: o.option_text,
      is_correct: o.is_correct,
      position: i,
    }))
  )
  revalidatePath("/admin/questions")
  return { success: true }
}
