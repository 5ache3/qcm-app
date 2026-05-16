"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ParsedQuestion } from "./parseCSV"

export async function importQuestions(subjectId: string, questions: ParsedQuestion[]) {
  const supabase = await createClient()

  let imported = 0
  for (const q of questions) {
    const { data: question, error } = await supabase
      .from("questions")
      .insert({
        subject_id: subjectId,
        question_text: q.question_text,
        explanation: q.explanation,
        difficulty: q.difficulty,
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
