import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Users, BookMarked, ClipboardList, ArrowLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClassInviteCode } from "./ClassInviteCode"
import { ClassHeaderEdit } from "./ClassHeaderEdit"
import { ClassCover } from "@/components/ClassCover"
import { ImageUploadButton } from "@/components/ImageUploadButton"
import { SubjectLogo } from "@/components/SubjectLogo"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function ClassOverviewPage({ params }: Props) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, description, invite_code, cover_url, created_at")
    .eq("id", classId)
    .eq("tutor_id", user!.id)
    .single()

  if (!cls) notFound()

  const [{ data: membershipsRaw }, { data: subjectsRaw }, headerList] = await Promise.all([
    supabase
      .from("class_memberships")
      .select("student_id, status, profiles(full_name)")
      .eq("class_id", classId)
      .order("joined_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name, icon, logo_url, questions(id)")
      .eq("class_id", classId)
      .order("name"),
    headers(),
  ])

  const host = headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")

  const students = (membershipsRaw ?? []).map((m) => ({
    studentId: m.student_id,
    fullName: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "Sans nom",
    status: m.status as "pending" | "approved",
  }))
  const subjects = (subjectsRaw ?? []).map((s) => ({
    ...s,
    questionCount: (s.questions as { id: string }[] | null)?.length ?? 0,
  }))

  const approved = students.filter((m) => m.status === "approved").length
  const pending = students.filter((m) => m.status === "pending").length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <ClassCover name={cls.name} coverUrl={cls.cover_url} className="h-40 rounded-2xl shadow-soft sm:h-52">
                <Button variant="ghost" size="icon" className="absolute start-3 top-3 bg-black/45 text-white backdrop-blur-md hover:bg-black/60 hover:text-white" asChild>
          <Link href="/tutor"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <ImageUploadButton target="class-cover" ownerId={classId} currentUrl={cls.cover_url} className="absolute end-3 top-3" />
      </ClassCover>

      <div className="flex items-start gap-3">
        <ClassHeaderEdit
          classId={classId}
          name={cls.name}
          description={cls.description}
        />
      </div>

      <ClassInviteCode classId={classId} code={cls.invite_code} baseUrl={`${protocol}://${host}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                Matières
                <span className="text-sm font-normal text-muted-foreground">({subjects.length})</span>
              </CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href={`/tutor/classes/${classId}/subjects`}>Gérer</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune matière pour l&apos;instant.</p>
            ) : (
              <div className="space-y-1.5">
                {subjects.map((s) => (
                  <Link
                    key={s.id}
                    href={`/tutor/classes/${classId}/subjects`}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2 hover:bg-muted/60 transition-colors"
                  >
                    <SubjectLogo name={s.name} logoUrl={s.logo_url} icon={s.icon} className="h-8 w-8 text-base" />
                    <p className="flex-1 min-w-0 text-sm font-medium truncate">{s.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {s.questionCount} question{s.questionCount !== 1 ? "s" : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Étudiants
                <span className="text-sm font-normal text-muted-foreground">({approved})</span>
                {pending > 0 && <Badge variant="warning" className="text-xs">{pending} en attente</Badge>}
              </CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href={`/tutor/classes/${classId}/students`}>Gérer</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun étudiant. Partagez le lien d&apos;invitation pour en ajouter.
              </p>
            ) : (
              <div className="space-y-1.5">
                {students.map((s) => (
                  <Link
                    key={s.studentId}
                    href={s.status === "approved"
                      ? `/tutor/classes/${classId}/students/${s.studentId}`
                      : `/tutor/classes/${classId}/students`}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2 hover:bg-muted/60 transition-colors"
                  >
                    <p className="flex-1 min-w-0 text-sm font-medium truncate">{s.fullName}</p>
                    {s.status === "pending" ? (
                      <Badge variant="warning" className="text-xs">En attente</Badge>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" className="w-full sm:w-auto" asChild>
        <Link href={`/tutor/classes/${classId}/questions`}>
          <ClipboardList className="h-4 w-4 me-1.5" />
          Questions
        </Link>
      </Button>
    </div>
  )
}
