import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trophy, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DeleteTestButton } from "@/components/DeleteTestButton"

interface Props {
  params: Promise<{ userId: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", userId)
    .single()

  if (!profile) notFound()

  const [
    { data: subjects },
    { data: practiceAnswers },
    { data: tests },
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, icon"),
    supabase
      .from("practice_answers")
      .select("subject_id, status, score")
      .eq("user_id", userId),
    supabase
      .from("tests")
      .select("id, subject_id, percentage, started_at, status")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(10),
  ])

  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s]))

  const practiceBySubject = new Map<string, { total: number; correct: number; partial: number; wrong: number }>()
  for (const a of practiceAnswers ?? []) {
    if (!practiceBySubject.has(a.subject_id)) {
      practiceBySubject.set(a.subject_id, { total: 0, correct: 0, partial: 0, wrong: 0 })
    }
    const entry = practiceBySubject.get(a.subject_id)!
    entry.total++
    if (a.status === "correct") entry.correct++
    else if (a.status === "partial") entry.partial++
    else entry.wrong++
  }

  const totalAnswered = practiceAnswers?.length ?? 0
  const totalCorrect = practiceAnswers?.filter((a) => a.status === "correct").length ?? 0
  const completedTests = tests?.length ?? 0
  const avgScore =
    completedTests > 0
      ? (tests!.reduce((sum, test) => sum + (test.percentage ?? 0), 0) / completedTests).toFixed(1)
      : null

  const locale = lang === "ar" ? "ar-MA" : "fr-FR"

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            {t.admin_users_title}
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name ?? t.admin_no_name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t.admin_registered_on} {new Date(profile.created_at).toLocaleDateString(locale)}
          </p>
        </div>
        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
          {profile.role}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.answered_label, value: totalAnswered },
          { label: t.stat_correct, value: totalCorrect },
          { label: t.stat_tests_completed, value: completedTests },
          { label: t.admin_avg_test_label, value: avgScore ? `${avgScore}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {practiceBySubject.size > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t.admin_user_practice_by_subject}
          </h2>
          <div className="space-y-3">
            {Array.from(practiceBySubject.entries()).map(([subjectId, stats]) => {
              const subject = subjectMap.get(subjectId)
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
              return (
                <div key={subjectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {subject?.icon ?? "📚"} {subject?.name ?? t.admin_user_unknown}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-green-600">{stats.correct} ✓</span>
                      <span className="text-yellow-600">{stats.partial} ~</span>
                      <span className="text-red-500">{stats.wrong} ✗</span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tests && tests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {t.admin_user_recent_tests}
          </h2>
          <div className="space-y-2">
            {tests.map((test) => {
              const subject = subjectMap.get(test.subject_id)
              const pct = test.percentage ?? 0
              return (
                <div key={test.id} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <Link href={`/tests/${test.id}/review`} className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {subject?.icon ?? "📚"} {subject?.name ?? t.admin_user_unknown}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.started_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <Badge variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </Link>
                  <DeleteTestButton testId={test.id} iconOnly size="sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {totalAnswered === 0 && completedTests === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t.admin_user_no_answers}
        </p>
      )}
    </div>
  )
}
