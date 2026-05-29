import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TutorQuestionsClient } from "./TutorQuestionsClient"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function ClassQuestionsPage({ params }: Props) {
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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, icon")
    .eq("class_id", classId)
    .order("name")

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tutor/classes/${classId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Questions — {cls.name}</h1>
          <p className="text-muted-foreground text-sm">Gérez les questions de vos matières</p>
        </div>
      </div>
      <TutorQuestionsClient classId={classId} subjects={subjects ?? []} />
    </div>
  )
}
