"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ParsedQuestion } from "./parseCSV"

export async function importQuestions(subjectId: string, questions: ParsedQuestion[]) {
  const supabase = await createClient()

  // Resolve lesson names → lesson IDs, creating missing lessons as needed
  const lessonNameToId = new Map<string, string>()

  const uniqueLessonNames = [...new Set(
    questions.map((q) => q.lesson).filter((l): l is string => l !== null)
  )]

  if (uniqueLessonNames.length > 0) {
    // Load existing lessons for this subject
    const { data: existing } = await supabase
      .from("lessons")
      .select("id, name")
      .eq("subject_id", subjectId)

    for (const l of existing ?? []) {
      lessonNameToId.set(l.name.toLowerCase(), l.id)
    }

    // Create lessons that don't exist yet
    const existingPosition = (existing ?? []).length
    for (let i = 0; i < uniqueLessonNames.length; i++) {
      const name = uniqueLessonNames[i]
      if (lessonNameToId.has(name.toLowerCase())) continue

      const { data: created } = await supabase
        .from("lessons")
        .insert({ subject_id: subjectId, name, position: existingPosition + i })
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

  revalidatePath("/admin/questions")
  revalidatePath(`/subjects/${subjectId}`)
  return { imported }
}
