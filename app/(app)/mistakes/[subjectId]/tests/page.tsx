import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuestionStatusBadge } from "@/components/QuestionStatusBadge"
import { ExportMistakesButton } from "@/components/ExportMistakesButton"
import type { MistakeItem } from "@/components/MistakesPDFDocument"

interface Props {
  params: Promise<{ subjectId: string }>
}

type RawAnswer = {
  question_id: string
  test_id: string
  selected_option_ids: string[]
  status: string
  questions: {
    question_text: string
    explanation: string | null
    answer_options: { id: string; option_text: string; is_correct: boolean; position: number }[]
  }
}

type TestMeta = {
  id: string
  test_number: number | null
  started_at: string
}

export default async function SubjectTestMistakesPage({ params }: Props) {
  const { subjectId } = await params
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { data: userTests }] = await Promise.all([
    supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
    supabase
      .from("tests")
      .select("id, test_number, started_at")
      .eq("user_id", user!.id)
      .eq("subject_id", subjectId)
      .in("status", ["completed", "expired"])
      .order("started_at", { ascending: false }),
  ])

  if (!subject) notFound()

  const testIds = (userTests ?? []).map((t: TestMeta) => t.id)
  const testMap = new Map<string, TestMeta>(
    (userTests ?? []).map((t: TestMeta) => [t.id, t])
  )

  const rawAnswers: RawAnswer[] =
    testIds.length > 0
      ? ((
          await supabase
            .from("test_answers")
            .select(`
              question_id,
              test_id,
              selected_option_ids,
              status,
              questions (
                id,
                question_text,
                explanation,
                answer_options ( id, option_text, is_correct, position )
              )
            `)
            .in("test_id", testIds)
            .in("status", ["wrong", "partial"])
        ).data as RawAnswer[] | null) ?? []
      : []

  // For each question keep the answer from the most recent test (lowest index in userTests)
  const testOrder = new Map<string, number>(
    (userTests ?? []).map((t: TestMeta, idx: number) => [t.id, idx])
  )
  const best = new Map<string, RawAnswer>()
  for (const ans of rawAnswers) {
    const order = testOrder.get(ans.test_id) ?? Infinity
    const existing = best.get(ans.question_id)
    const existingOrder = existing ? (testOrder.get(existing.test_id) ?? Infinity) : Infinity
    if (order < existingOrder) {
      best.set(ans.question_id, ans)
    }
  }

  const answers = Array.from(best.values()).sort(
    (a, b) => (testOrder.get(a.test_id) ?? 0) - (testOrder.get(b.test_id) ?? 0)
  )

  const pdfMistakes: MistakeItem[] = answers.map((ans) => ({
    question_id: ans.question_id,
    status: ans.status as "wrong" | "partial",
    selected_option_ids: ans.selected_option_ids,
    question_text: ans.questions.question_text,
    explanation: ans.questions.explanation,
    answer_options: ans.questions.answer_options,
  }))

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mistakes">
            <ArrowLeft className="h-4 w-4 me-1" />
            {t.all_subjects}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ExportMistakesButton subjectName={subject.name} mistakes={pdfMistakes} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/mistakes/${subjectId}`}>
              <BookOpen className="h-3.5 w-3.5 me-1.5" />
              {t.practice_mistakes_link}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{subject.icon ?? "📚"}</span>
        <div>
          <h1 className="text-2xl font-bold">{t.test_mistakes_title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subject.name}</p>
          {answers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {answers.length} {t.to_review_count}
            </p>
          )}
        </div>
      </div>

      {answers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.test_mistakes_empty}</p>
      ) : (
        <div className="space-y-3">
          {answers.map((ans) => {
            const q = ans.questions
            const selectedIds: string[] = ans.selected_option_ids
            const testInfo = testMap.get(ans.test_id)
            const sortedOptions = [...(q.answer_options ?? [])].sort(
              (a, b) => a.position - b.position
            )

            return (
              <Card key={ans.question_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-0.5">
                      {testInfo && (
                        <p className="text-xs text-muted-foreground">
                          {t.test_label} #{testInfo.test_number ?? "?"}
                        </p>
                      )}
                      <CardTitle className="text-sm font-medium leading-relaxed">
                        {q.question_text}
                      </CardTitle>
                    </div>
                    <QuestionStatusBadge status={ans.status as "correct" | "wrong" | "partial"} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {sortedOptions.map((opt) => {
                      const isSelected = selectedIds.includes(opt.id)
                      const isCorrect = opt.is_correct

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
                          key={opt.id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${style}`}
                        >
                          <span className="shrink-0">
                            {isCorrect ? "✓" : isSelected ? "✗" : "○"}
                          </span>
                          <span>{opt.option_text}</span>
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2 mt-1">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">
                        {t.explanation_label}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
