import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Users, BookMarked, ClipboardList, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClassInviteCode } from "./ClassInviteCode"
import { ClassHeaderEdit } from "./ClassHeaderEdit"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function ClassOverviewPage({ params }: Props) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, description, invite_code, created_at")
    .eq("id", classId)
    .eq("tutor_id", user!.id)
    .single()

  if (!cls) notFound()

  const [{ data: memberships }, { data: subjects }] = await Promise.all([
    supabase
      .from("class_memberships")
      .select("status")
      .eq("class_id", classId),
    supabase
      .from("subjects")
      .select("id")
      .eq("class_id", classId),
  ])

  const approved = (memberships ?? []).filter((m) => m.status === "approved").length
  const pending = (memberships ?? []).filter((m) => m.status === "pending").length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 mt-1" asChild>
          <Link href="/tutor"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <ClassHeaderEdit
          classId={classId}
          name={cls.name}
          description={cls.description}
        />
      </div>

      <ClassInviteCode classId={classId} code={cls.invite_code} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-2xl font-bold">{approved}</p>
              <p className="text-xs text-muted-foreground">
                étudiant{approved !== 1 ? "s" : ""} approuvé{approved !== 1 ? "s" : ""}
                {pending > 0 && (
                  <> · <span className="text-amber-600">{pending} en attente</span></>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <BookMarked className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-2xl font-bold">{subjects?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">matière{(subjects?.length ?? 0) !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">tests complétés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button variant="outline" className="h-16 flex-col gap-1" asChild>
          <Link href={`/tutor/classes/${classId}/students`}>
            <Users className="h-5 w-5" />
            <span className="text-sm">Étudiants</span>
            {pending > 0 && <Badge variant="warning" className="text-xs">{pending} en attente</Badge>}
          </Link>
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1" asChild>
          <Link href={`/tutor/classes/${classId}/subjects`}>
            <BookMarked className="h-5 w-5" />
            <span className="text-sm">Matières</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1" asChild>
          <Link href={`/tutor/classes/${classId}/questions`}>
            <ClipboardList className="h-5 w-5" />
            <span className="text-sm">Questions</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
