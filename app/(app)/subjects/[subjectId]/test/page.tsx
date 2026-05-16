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

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, icon")
    .eq("id", subjectId)
    .single()

  if (!subject) notFound()

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("subject_id", subjectId)

  return (
    <TestClient
      subject={subject}
      questionCount={questionCount ?? 0}
      userId={user!.id}
    />
  )
}
