"use server"

import { createClient } from "@/lib/supabase/server"
import type { QuestionStatus } from "@/lib/scoring"

interface SaveAnswerParams {
  userId: string
  subjectId: string
  questionId: string
  selectedOptionIds: string[]
  score: number
  status: Exclude<QuestionStatus, "unanswered">
}

export async function saveAnswer(params: SaveAnswerParams) {
  const supabase = await createClient()

  const { error } = await supabase.from("practice_answers").upsert(
    {
      user_id: params.userId,
      subject_id: params.subjectId,
      question_id: params.questionId,
      selected_option_ids: params.selectedOptionIds,
      score: params.score,
      status: params.status,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" }
  )

  if (error) {
    console.error("saveAnswer error:", error)
    return { success: false }
  }

  return { success: true }
}
