import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TestClient } from "./TestClient"

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function TestPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { count: questionCount }, { data: activeTest }] = await Promise.all([
    supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("subject_id", subjectId),
    supabase
      .from("tests")
      .select("id")
      .eq("user_id", user!.id)
      .eq("subject_id", subjectId)
      .is("lesson_id", null)
      .eq("status", "in_progress")
      .maybeSingle(),
  ])

  if (!subject) notFound()

  return (
    <TestClient
      subject={subject}
      questionCount={questionCount ?? 0}
      userId={user!.id}
      hasActiveTest={!!activeTest}
    />
  )
}
