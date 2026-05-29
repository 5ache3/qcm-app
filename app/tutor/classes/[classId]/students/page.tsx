import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StudentsClient } from "./StudentsClient"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function StudentsPage({ params }: Props) {
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

  // Get all memberships with profile info
  const { data: memberships } = await supabase
    .from("class_memberships")
    .select("student_id, status, joined_at, profiles(full_name)")
    .eq("class_id", classId)
    .order("joined_at", { ascending: false })

  const studentIds = (memberships ?? []).map((m) => m.student_id)

  // Get class subjects for scoping stats
  const { data: classSubjects } = await supabase
    .from("subjects")
    .select("id")
    .eq("class_id", classId)

  const subjectIds = (classSubjects ?? []).map((s) => s.id)

  let practiceStats: Array<{ user_id: string; subject_id: string; status: string }> = []
  let testStats: Array<{ user_id: string; percentage: number | null }> = []

  if (studentIds.length > 0 && subjectIds.length > 0) {
    const [{ data: pa }, { data: ts }] = await Promise.all([
      supabase
        .from("practice_answers")
        .select("user_id, subject_id, status")
        .in("user_id", studentIds)
        .in("subject_id", subjectIds),
      supabase
        .from("tests")
        .select("user_id, percentage")
        .in("user_id", studentIds)
        .in("subject_id", subjectIds)
        .eq("status", "completed"),
    ])
    practiceStats = (pa ?? []) as typeof practiceStats
    testStats = (ts ?? []) as typeof testStats
  }

  // Build per-student stats
  const studentRows = (memberships ?? []).map((m) => {
    const pa = practiceStats.filter((a) => a.user_id === m.student_id)
    const ts = testStats.filter((t) => t.user_id === m.student_id)
    const subjectsDone = new Set(pa.map((a) => a.subject_id)).size
    const correct = pa.filter((a) => a.status === "correct").length
    const total = pa.length
    const avgScore =
      ts.length > 0
        ? Math.round(ts.reduce((sum, t) => sum + (t.percentage ?? 0), 0) / ts.length)
        : null

    return {
      studentId: m.student_id,
      fullName: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "Sans nom",
      status: m.status as "pending" | "approved",
      joinedAt: m.joined_at,
      subjectsDone,
      totalAnswered: total,
      correct,
      testsCompleted: ts.length,
      avgScore,
    }
  })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tutor/classes/${classId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Étudiants — {cls.name}</h1>
          <p className="text-muted-foreground text-sm">{studentRows.filter((s) => s.status === "approved").length} approuvé(s)</p>
        </div>
      </div>

      <StudentsClient classId={classId} students={studentRows} />
    </div>
  )
}
