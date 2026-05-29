import { createClient } from "@/lib/supabase/server"
import { SubjectsAdminClient } from "./SubjectsAdminClient"

export default async function AdminSubjectsPage() {
  const supabase = await createClient()

  const [{ data: subjects }, { data: counts }, { data: classes }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, description, icon, due_date, class_id, created_at")
      .is("class_id", null)
      .order("name"),
    supabase.from("questions").select("subject_id"),
    supabase.from("classes").select("id, name").order("name"),
  ])

  const questionCountMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    questionCountMap[row.subject_id] = (questionCountMap[row.subject_id] ?? 0) + 1
  }

  return (
    <SubjectsAdminClient
      subjects={subjects ?? []}
      questionCountMap={questionCountMap}
      classes={classes ?? []}
    />
  )
}
