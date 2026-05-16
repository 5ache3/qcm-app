import { createClient } from "@/lib/supabase/server"
import { QuestionsPageClient } from "./QuestionsPageClient"

export default async function AdminQuestionsPage() {
  const supabase = await createClient()
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, icon")
    .order("name")
  return <QuestionsPageClient subjects={subjects ?? []} />
}
