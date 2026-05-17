import { createClient } from "@/lib/supabase/server"
import { SubjectsAdminClient } from "./SubjectsAdminClient"

export default async function AdminSubjectsPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, description, icon, due_date, created_at")
    .order("name")

  const { data: counts } = await supabase
    .from("questions")
    .select("subject_id")

  const questionCountMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    questionCountMap[row.subject_id] = (questionCountMap[row.subject_id] ?? 0) + 1
  }

  return (
    <SubjectsAdminClient
      subjects={subjects ?? []}
      questionCountMap={questionCountMap}
    />
  )
}
