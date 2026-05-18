import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PracticeClient } from "../../../practice/PracticeClient"
import { shuffleArray } from "@/lib/utils"

interface Props {
  params: Promise<{ subjectId: string; lessonId: string }>
}

export default async function LessonPracticePage({ params }: Props) {
  const { subjectId, lessonId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { data: lesson }, { data: questions }] = await Promise.all([
    supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
    supabase.from("lessons").select("id, name").eq("id", lessonId).eq("subject_id", subjectId).single(),
    supabase
      .from("questions")
      .select(`
        id,
        question_text,
        explanation,
        difficulty,
        lesson_id,
        answer_options (
          id,
          option_text,
          is_correct,
          position
        )
      `)
      .eq("subject_id", subjectId)
      .eq("lesson_id", lessonId)
      .order("created_at"),
  ])

  if (!subject || !lesson || !questions) notFound()

  const questionsWithSortedOptions = questions.map((q) => ({
    ...q,
    lesson_name: lesson.name,
    answer_options: shuffleArray([...(q.answer_options ?? [])].sort((a, b) => a.position - b.position)),
  }))

  const { data: existingAnswers } = await supabase
    .from("practice_answers")
    .select("question_id, selected_option_ids, score, status")
    .eq("user_id", user!.id)
    .eq("subject_id", subjectId)
    .in("question_id", questions.map((q) => q.id))

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
      lesson={lesson}
    />
  )
}
