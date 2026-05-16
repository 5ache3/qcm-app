import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trophy, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Props {
  params: Promise<{ userId: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()

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

  // Per-subject practice stats
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
      ? (tests!.reduce((sum, t) => sum + (t.percentage ?? 0), 0) / completedTests).toFixed(1)
      : null

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name ?? "Unnamed user"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
          {profile.role}
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Answered", value: totalAnswered },
          { label: "Correct", value: totalCorrect },
          { label: "Tests done", value: completedTests },
          { label: "Avg score", value: avgScore ? `${avgScore}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Per-subject practice */}
      {practiceBySubject.size > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Practice by subject
          </h2>
          <div className="space-y-3">
            {Array.from(practiceBySubject.entries()).map(([subjectId, stats]) => {
              const subject = subjectMap.get(subjectId)
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
              return (
                <div key={subjectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {subject?.icon ?? "📚"} {subject?.name ?? "Unknown"}
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

      {/* Recent tests */}
      {tests && tests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Recent tests
          </h2>
          <div className="space-y-2">
            {tests.map((test) => {
              const subject = subjectMap.get(test.subject_id)
              const pct = test.percentage ?? 0
              return (
                <Link key={test.id} href={`/tests/${test.id}/review`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">
                        {subject?.icon ?? "📚"} {subject?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {totalAnswered === 0 && completedTests === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          This user hasn&apos;t answered any questions yet.
        </p>
      )}
    </div>
  )
}
