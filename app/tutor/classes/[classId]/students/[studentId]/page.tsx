import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookMarked, ClipboardList, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ classId: string; studentId: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { classId, studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify this class belongs to the tutor and student is a member
  const [{ data: cls }, { data: membership }, { data: studentProfile }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("id", classId).eq("tutor_id", user!.id).single(),
    supabase.from("class_memberships").select("status, joined_at").eq("class_id", classId).eq("student_id", studentId).single(),
    supabase.from("profiles").select("full_name").eq("id", studentId).single(),
  ])

  if (!cls || !membership) notFound()

  const { data: classSubjects } = await supabase
    .from("subjects")
    .select("id, name, icon")
    .eq("class_id", classId)
    .order("name")

  const subjectIds = (classSubjects ?? []).map((s) => s.id)

  let practiceAnswers: Array<{ subject_id: string; status: string; score: number }> = []
  let tests: Array<{ subject_id: string; percentage: number | null; score: number | null; completed_at: string | null; status: string }> = []

  if (subjectIds.length > 0) {
    const [{ data: pa }, { data: ts }] = await Promise.all([
      supabase
        .from("practice_answers")
        .select("subject_id, status, score")
        .eq("user_id", studentId)
        .in("subject_id", subjectIds),
      supabase
        .from("tests")
        .select("subject_id, percentage, score, completed_at, status")
        .eq("user_id", studentId)
        .in("subject_id", subjectIds)
        .order("completed_at", { ascending: false }),
    ])
    practiceAnswers = (pa ?? []) as typeof practiceAnswers
    tests = (ts ?? []) as typeof tests
  }

  const completedTests = tests.filter((t) => t.status === "completed")
  const totalAnswered = practiceAnswers.length
  const correct = practiceAnswers.filter((a) => a.status === "correct").length
  const partial = practiceAnswers.filter((a) => a.status === "partial").length
  const wrong = practiceAnswers.filter((a) => a.status === "wrong").length
  const avgScore =
    completedTests.length > 0
      ? Math.round(completedTests.reduce((s, t) => s + (t.percentage ?? 0), 0) / completedTests.length)
      : null

  // Per-subject breakdown
  const subjectBreakdown = (classSubjects ?? []).map((subj) => {
    const pa = practiceAnswers.filter((a) => a.subject_id === subj.id)
    const subjTests = completedTests.filter((t) => t.subject_id === subj.id)
    return {
      id: subj.id,
      name: subj.name,
      icon: subj.icon,
      answered: pa.length,
      correct: pa.filter((a) => a.status === "correct").length,
      partial: pa.filter((a) => a.status === "partial").length,
      wrong: pa.filter((a) => a.status === "wrong").length,
      tests: subjTests.length,
      avgPct: subjTests.length > 0
        ? Math.round(subjTests.reduce((s, t) => s + (t.percentage ?? 0), 0) / subjTests.length)
        : null,
    }
  })

  const fullName = studentProfile?.full_name ?? "Étudiant"

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tutor/classes/${classId}/students`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground text-sm">
            {cls.name} · Rejoint le {new Date(membership.joined_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <Badge variant={membership.status === "approved" ? "success" : "warning"} className="ms-auto">
          {membership.status === "approved" ? "Approuvé" : "En attente"}
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{totalAnswered}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Réponses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Correctes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{completedTests.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tests complétés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className={`text-2xl font-bold ${avgScore !== null && avgScore >= 70 ? "text-green-600" : avgScore !== null && avgScore >= 50 ? "text-amber-600" : "text-destructive"}`}>
              {avgScore !== null ? `${avgScore}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Score moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-subject breakdown */}
      {subjectBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Progression par matière
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {subjectBreakdown.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                  <span className="text-xl shrink-0">{s.icon ?? "📚"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />{s.correct}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <MinusCircle className="h-3 w-3" />{s.partial}
                      </span>
                      <span className="flex items-center gap-0.5 text-destructive">
                        <XCircle className="h-3 w-3" />{s.wrong}
                      </span>
                      {s.answered > 0 && (
                        <span>{s.answered} réponses</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {s.tests > 0 ? (
                      <>
                        <Badge variant={s.avgPct !== null && s.avgPct >= 70 ? "success" : s.avgPct !== null && s.avgPct >= 50 ? "warning" : "destructive"}>
                          {s.avgPct}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.tests} test{s.tests > 1 ? "s" : ""}</p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pas de test</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent tests */}
      {completedTests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tests récents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {completedTests.slice(0, 10).map((t, i) => {
                const subj = classSubjects?.find((s) => s.id === t.subject_id)
                return (
                  <div key={i} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-base">{subj?.icon ?? "📚"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{subj?.name ?? "—"}</p>
                      {t.completed_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <Badge variant={(t.percentage ?? 0) >= 70 ? "success" : (t.percentage ?? 0) >= 50 ? "warning" : "destructive"}>
                      {t.percentage !== null ? `${Math.round(t.percentage)}%` : "—"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalAnswered === 0 && completedTests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Cet étudiant n&apos;a pas encore commencé à pratiquer.</p>
        </div>
      )}
    </div>
  )
}
