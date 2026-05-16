import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuestionStatusBadge } from "@/components/QuestionStatusBadge"

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectMistakesPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { data: answers }] = await Promise.all([
    supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
    supabase
      .from("practice_answers")
      .select(`
        question_id,
        selected_option_ids,
        score,
        status,
        answered_at,
        questions (
          id,
          question_text,
          explanation,
          answer_options ( id, option_text, is_correct, position )
        )
      `)
      .eq("user_id", user!.id)
      .eq("subject_id", subjectId)
      .in("status", ["wrong", "partial"])
      .order("answered_at", { ascending: false }),
  ])

  if (!subject) notFound()

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mistakes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All subjects
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/subjects/${subjectId}/practice`}>
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Practise
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{subject.icon ?? "📚"}</span>
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {answers?.length ?? 0} question{(answers?.length ?? 0) !== 1 ? "s" : ""} to review
          </p>
        </div>
      </div>

      {!answers || answers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No mistakes for this subject.</p>
      ) : (
        <div className="space-y-3">
          {answers.map((ans) => {
            const q = ans.questions as any
            const selectedIds: string[] = ans.selected_option_ids
            const sortedOptions = [...(q.answer_options ?? [])].sort(
              (a: any, b: any) => a.position - b.position
            )

            return (
              <Card key={ans.question_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-medium leading-relaxed">
                      {q.question_text}
                    </CardTitle>
                    <QuestionStatusBadge status={ans.status as any} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {sortedOptions.map((opt: any) => {
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
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">Explanation</p>
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
