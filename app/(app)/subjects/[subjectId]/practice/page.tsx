import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PracticeClient } from "./PracticeClient"
import { shuffleArray } from "@/lib/utils"

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function PracticePage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { data: questions }] = await Promise.all([
    supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
    supabase
      .from("questions")
      .select(`
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
      `)
      .eq("subject_id", subjectId)
      .order("created_at"),
  ])

  if (!subject || !questions) notFound()

  // Sort options by position then shuffle for variety
  const questionsWithSortedOptions = questions.map((q) => ({
    ...q,
    answer_options: shuffleArray([...(q.answer_options ?? [])].sort((a, b) => a.position - b.position)),
  }))

  // Load existing answers for this user + subject
  const { data: existingAnswers } = await supabase
    .from("practice_answers")
    .select("question_id, selected_option_ids, score, status")
    .eq("user_id", user!.id)
    .eq("subject_id", subjectId)

  const answersMap: Record<string, { selected_option_ids: string[]; score: number; status: string }> = {}
  for (const a of existingAnswers ?? []) {
    answersMap[a.question_id] = {
      selected_option_ids: a.selected_option_ids,
      score: a.score,
      status: a.status,
    }
  }

  return (
    <PracticeClient
      subject={subject}
      questions={questionsWithSortedOptions}
      existingAnswers={answersMap}
      userId={user!.id}
    />
  )
}
