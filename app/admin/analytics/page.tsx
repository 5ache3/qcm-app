import { createClient } from "@/lib/supabase/server"
import { TrendingDown, Users, BarChart2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [
    { data: subjects },
    { data: allPracticeAnswers },
    { data: allTests },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, icon"),
    supabase
      .from("practice_answers")
      .select("subject_id, question_id, status, score, user_id"),
    supabase
      .from("tests")
      .select("subject_id, percentage, user_id")
      .eq("status", "completed"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
  ])

  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s]))

  // ── Per-subject stats ─────────────────────────────────────────
  type SubjectStat = {
    subjectId: string
    totalAnswers: number
    correctAnswers: number
    activeUsers: Set<string>
    testScores: number[]
  }

  const subjectStats = new Map<string, SubjectStat>()

  for (const a of allPracticeAnswers ?? []) {
    if (!subjectStats.has(a.subject_id)) {
      subjectStats.set(a.subject_id, {
        subjectId: a.subject_id,
        totalAnswers: 0,
        correctAnswers: 0,
        activeUsers: new Set(),
        testScores: [],
      })
    }
    const s = subjectStats.get(a.subject_id)!
    s.totalAnswers++
    if (a.status === "correct") s.correctAnswers++
    s.activeUsers.add(a.user_id)
  }

  for (const t of allTests ?? []) {
    if (!subjectStats.has(t.subject_id)) {
      subjectStats.set(t.subject_id, {
        subjectId: t.subject_id,
        totalAnswers: 0,
        correctAnswers: 0,
        activeUsers: new Set(),
        testScores: [],
      })
    }
    subjectStats.get(t.subject_id)!.testScores.push(t.percentage ?? 0)
  }

  const subjectRows = Array.from(subjectStats.values())
    .map((s) => ({
      ...s,
      subject: subjectMap.get(s.subjectId),
      correctPct: s.totalAnswers > 0 ? Math.round((s.correctAnswers / s.totalAnswers) * 100) : null,
      avgTestScore:
        s.testScores.length > 0
          ? Math.round(s.testScores.reduce((a, b) => a + b, 0) / s.testScores.length)
          : null,
    }))
    .sort((a, b) => b.totalAnswers - a.totalAnswers)

  // ── Hardest questions (most wrong answers) ────────────────────
  const questionFailMap = new Map<string, { wrong: number; total: number; subjectId: string }>()

  for (const a of allPracticeAnswers ?? []) {
    if (!questionFailMap.has(a.question_id)) {
      questionFailMap.set(a.question_id, { wrong: 0, total: 0, subjectId: a.subject_id })
    }
    const q = questionFailMap.get(a.question_id)!
    q.total++
    if (a.status === "wrong" || a.status === "partial") q.wrong++
  }

  const hardestQuestionIds = Array.from(questionFailMap.entries())
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total)
    .slice(0, 10)
    .map(([id]) => id)

  let hardestQuestions: { id: string; question_text: string; subject_id: string }[] = []
  if (hardestQuestionIds.length > 0) {
    const { data } = await supabase
      .from("questions")
      .select("id, question_text, subject_id")
      .in("id", hardestQuestionIds)
    hardestQuestions = data ?? []
  }

  const hardestRows = hardestQuestions
    .map((q) => {
      const stats = questionFailMap.get(q.id)!
      return {
        ...q,
        failRate: Math.round((stats.wrong / stats.total) * 100),
        total: stats.total,
        subject: subjectMap.get(q.subject_id),
      }
    })
    .sort((a, b) => b.failRate - a.failRate)

  // ── Overall numbers ───────────────────────────────────────────
  const totalAnswers = allPracticeAnswers?.length ?? 0
  const totalTests = allTests?.length ?? 0
  const overallCorrectPct =
    totalAnswers > 0
      ? Math.round(
          ((allPracticeAnswers?.filter((a) => a.status === "correct").length ?? 0) / totalAnswers) * 100
        )
      : null

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      {/* Top-level numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Étudiants", value: userCount ?? 0 },
          { label: "Réponses entraînement", value: totalAnswers },
          { label: "Tests complétés", value: totalTests },
          { label: "Correct global", value: overallCorrectPct != null ? `${overallCorrectPct}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Per-subject */}
      {subjectRows.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Performance par matière
          </h2>
          <div className="space-y-4">
            {subjectRows.map((row) => (
              <div key={row.subjectId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {row.subject?.icon ?? "📚"} {row.subject?.name ?? "Unknown"}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {row.activeUsers.size} actif{row.activeUsers.size > 1 ? "s" : ""}
                    </span>
                    <span>{row.totalAnswers} réponses</span>
                    {row.avgTestScore != null && (
                      <span>moy. test {row.avgTestScore}%</span>
                    )}
                    {row.correctPct != null && (
                      <Badge
                        variant={row.correctPct >= 70 ? "success" : row.correctPct >= 50 ? "warning" : "error"}
                        className="text-xs"
                      >
                        {row.correctPct}% correct
                      </Badge>
                    )}
                  </div>
                </div>
                {row.correctPct != null && (
                  <Progress value={row.correctPct} className="h-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hardest questions */}
      {hardestRows.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Questions les plus ratées
          </h2>
          <div className="space-y-2">
            {hardestRows.map((q) => (
              <Card key={q.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm leading-snug line-clamp-2">{q.question_text}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.subject?.icon ?? "📚"} {q.subject?.name} · {q.total} tentative{q.total > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      variant={q.failRate >= 70 ? "error" : q.failRate >= 40 ? "warning" : "muted"}
                      className="shrink-0"
                    >
                      {q.failRate}% d&apos;échec
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {subjectRows.length === 0 && hardestRows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune donnée. Les statistiques apparaîtront lorsque les étudiants commenceront à s&apos;entraîner.</p>
        </div>
      )}
    </div>
  )
}
