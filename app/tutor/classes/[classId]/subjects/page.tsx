import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubjectsClassClient } from "./SubjectsClassClient"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function ClassSubjectsPage({ params }: Props) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .eq("tutor_id", user!.id)
    .single()

  if (!cls) notFound()

  const { data: subjectsRaw } = await supabase
    .from("subjects")
    .select("id, name, description, icon, due_date, created_at, questions(id)")
    .eq("class_id", classId)
    .order("name")

  const questionCountMap: Record<string, number> = {}
  for (const s of subjectsRaw ?? []) {
    questionCountMap[s.id] = (s.questions as { id: string }[] | null)?.length ?? 0
  }
  const subjects = (subjectsRaw ?? []).map(({ questions: _q, ...rest }) => rest)

  return (
    <div>
      <div className="flex items-center gap-3 p-4 sm:p-6 pb-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tutor/classes/${classId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="text-sm text-muted-foreground">{cls.name}</p>
      </div>
      <SubjectsClassClient
        classId={classId}
        subjects={subjects ?? []}
        questionCountMap={questionCountMap}
      />
    </div>
  )
}
