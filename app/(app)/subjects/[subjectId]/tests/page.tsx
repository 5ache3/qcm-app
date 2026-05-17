import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RetakeButton } from "@/components/RetakeButton"

interface Props {
  params: Promise<{ subjectId: string }>
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default async function SubjectTestsPage({ params }: Props) {
  const { subjectId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: subject } = await supabase
    .from("subjects")
    .select("name, icon")
    .eq("id", subjectId)
    .single()

  if (!subject) notFound()

  const { data: tests } = await supabase
    .from("tests")
    .select("id, started_at, completed_at, duration_seconds, score, percentage, status, retake_of")
    .eq("user_id", user!.id)
    .eq("subject_id", subjectId)
    .in("status", ["completed", "expired"])
    .order("started_at", { ascending: false })

  // Compute attempt number for each test (1 = original, 2 = first retry, etc.)
  const attemptMap = new Map<string, number>()
  if (tests) {
    for (const test of [...tests].reverse()) {
      const retakeOf = test.retake_of as string | null
      if (!retakeOf) {
        attemptMap.set(test.id, 1)
      } else {
        const parentAttempt = attemptMap.get(retakeOf) ?? 1
        attemptMap.set(test.id, parentAttempt + 1)
      }
    }
  }

  const locale = lang === "ar" ? "ar-MA" : "fr-FR"

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/subjects/${subjectId}`}>
            <ArrowLeft className="h-4 w-4" />
            {subject.icon ?? "📚"} {subject.name}
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold">{t.tests_title}</h1>

      {!tests || tests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{t.tests_empty}</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}/test`}>{t.start_test}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          {tests.map((test) => {
            const pct = test.percentage ?? 0
            const attempt = attemptMap.get(test.id) ?? 1

            return (
              <Card key={test.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  {/* Clickable area → review */}
                  <Link href={`/tests/${test.id}/review`} className="flex-1 min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {new Date(test.started_at).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          <span className="text-muted-foreground font-normal">
                            {new Date(test.started_at).toLocaleTimeString(locale, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                        {attempt > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {t.retake_label} #{attempt}
                          </Badge>
                        )}
                        {test.status === "expired" && (
                          <Badge variant="warning" className="text-xs">{t.test_expired}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(test.duration_seconds)}
                        </span>
                        <span>{(test.score ?? 0).toFixed(2)} pts</span>
                      </div>
                    </div>
                  </Link>

                  {/* Score badge + retake button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}
                      className="text-sm px-3 py-1"
                    >
                      {pct.toFixed(0)}%
                    </Badge>
                    <RetakeButton testId={test.id} iconOnly size="sm" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
