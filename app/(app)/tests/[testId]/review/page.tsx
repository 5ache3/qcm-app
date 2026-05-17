import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QuestionStatusBadge } from "@/components/QuestionStatusBadge"
import { RetakeButton } from "@/components/RetakeButton"
import { DeleteTestButton } from "@/components/DeleteTestButton"
import type { QuestionStatus } from "@/lib/scoring"

interface Props {
  params: Promise<{ testId: string }>
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default async function TestReviewPage({ params }: Props) {
  const { testId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: test } = await supabase
    .from("tests")
    .select("id, subject_id, percentage, score, duration_seconds, status, started_at, test_number, retake_of, subjects(name, icon)")
    .eq("id", testId)
    .eq("user_id", user!.id)
    .single()

  if (!test) notFound()

  // Look up parent test number if this is a retake
  let parentTestNumber: number | null = null
  if (test.retake_of) {
    const { data: parent } = await supabase
      .from("tests")
      .select("test_number")
      .eq("id", test.retake_of as string)
      .single()
    parentTestNumber = (parent?.test_number as number | null) ?? null
  }

  const { data: testQuestions } = await supabase
    .from("test_questions")
    .select(`
      position,
      question_id,
      score,
      questions (
        id,
        question_text,
        explanation,
        answer_options ( id, option_text, is_correct, position )
      )
    `)
    .eq("test_id", testId)
    .order("position")

  const { data: testAnswers } = await supabase
    .from("test_answers")
    .select("question_id, selected_option_ids, status")
    .eq("test_id", testId)

  if (!testQuestions) notFound()

  const answerMap = new Map(
    (testAnswers ?? []).map((a) => [a.question_id, a])
  )

  const pct = test.percentage ?? 0
  const locale = lang === "ar" ? "ar-MA" : "fr-FR"

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/subjects/${test.subject_id}`}>
            <ArrowLeft className="h-4 w-4" />
            {t.review_back}
          </Link>
        </Button>
      </div>

      <Card
        className={
          pct >= 80
            ? "border-green-300 bg-green-50 dark:bg-green-950/20"
            : pct >= 50
            ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20"
            : "border-red-300 bg-red-50 dark:bg-red-950/20"
        }
      >
        <CardContent className="pt-6 pb-6 text-center space-y-2">
          <div className="flex justify-center">
            <Trophy className={`h-10 w-10 ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`} />
          </div>
          <div className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
            {t.test_label} #{(test.test_number as number | null) ?? "?"}
            {parentTestNumber != null && (
              <span className="ml-2 normal-case font-normal">
                ↺ {t.test_label} #{parentTestNumber}
              </span>
            )}
          </div>
          <div className="text-4xl font-bold">{pct.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">
            {test.score?.toFixed(2)} / {testQuestions.length} points
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(test.duration_seconds)}
            </span>
            <span>
              {new Date(test.started_at).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              {new Date(test.started_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {test.status === "expired" && (
              <Badge variant="error">{t.review_time_expired}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-semibold text-lg">{t.review_title}</h2>
        {testQuestions.map((tq) => {
          const q = tq.questions as unknown as { question_text: string; explanation: string | null; answer_options: { id: string; option_text: string; is_correct: boolean; position: number }[] }
          const answer = answerMap.get(tq.question_id)
          const selectedIds: string[] = answer?.selected_option_ids ?? []
          const status = (answer?.status ?? "unanswered") as QuestionStatus
          const sortedOptions = [...(q.answer_options ?? [])].sort((a, b) => a.position - b.position)

          return (
            <Card key={tq.question_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Q{tq.position}</span>
                      {tq.score !== null && (
                        <span className="font-medium">
                          {Number(tq.score).toFixed(2)} pts
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-sm font-medium leading-relaxed">
                      {q.question_text}
                    </CardTitle>
                  </div>
                  <QuestionStatusBadge status={status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedOptions.map((option) => {
                  const isSelected = selectedIds.includes(option.id)
                  const isCorrect = option.is_correct

                  let style = "border-border bg-background text-muted-foreground"
                  if (isCorrect && isSelected) {
                    style = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200"
                  } else if (isCorrect && !isSelected) {
                    style = "border-green-300 bg-green-50/50 dark:bg-green-950/10 text-green-700 dark:text-green-300"
                  } else if (!isCorrect && isSelected) {
                    style = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
                  }

                  return (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${style}`}
                    >
                      <span className="w-4 shrink-0">
                        {isCorrect ? "✓" : isSelected ? "✗" : "○"}
                      </span>
                      <span className="leading-relaxed">{option.option_text}</span>
                    </div>
                  )
                })}
                {q.explanation && (
                  <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">{t.explanation_label}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator />
      <div className="flex items-center gap-3 pb-6">
        <Button asChild variant="outline">
          <Link href={`/subjects/${test.subject_id}`}>{t.review_back_subject}</Link>
        </Button>
        <RetakeButton testId={testId} variant="default" size="default" />
        <DeleteTestButton
          testId={testId}
          redirectTo={`/subjects/${test.subject_id}/tests`}
          size="default"
        />
      </div>
    </div>
  )
}
