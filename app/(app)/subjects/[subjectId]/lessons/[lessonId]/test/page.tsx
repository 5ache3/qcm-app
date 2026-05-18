import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TestClient } from "../../../test/TestClient"

interface Props {
  params: Promise<{ subjectId: string; lessonId: string }>
}

export default async function LessonTestPage({ params }: Props) {
  const { subjectId, lessonId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { data: lesson }, { count: questionCount }, { data: activeTest }] =
    await Promise.all([
      supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
      supabase.from("lessons").select("id, name").eq("id", lessonId).eq("subject_id", subjectId).single(),
      supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId)
        .eq("lesson_id", lessonId),
      supabase
        .from("tests")
        .select("id")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId)
        .eq("status", "in_progress")
        .maybeSingle(),
    ])

  if (!subject || !lesson) notFound()

  return (
    <TestClient
      subject={subject}
      questionCount={questionCount ?? 0}
      userId={user!.id}
      hasActiveTest={!!activeTest}
      lesson={lesson}
    />
  )
}
