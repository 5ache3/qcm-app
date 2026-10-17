import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BookOpen, Timer, History, ArrowLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SubjectLogo } from "@/components/SubjectLogo"

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: subject },
    { count: questionCount },
    { data: answers },
    { data: recentTests },
    { data: lessons },
  ] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single(),
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId),
    supabase
      .from("practice_answers")
      .select("status, question_id, questions(lesson_id)")
      .eq("user_id", user!.id)
      .eq("subject_id", subjectId),
    supabase
      .from("tests")
      .select("id, started_at, percentage, status")
      .eq("user_id", user!.id)
      .eq("subject_id", subjectId)
      .is("lesson_id", null)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(3),
    supabase
      .from("lessons")
      .select("id, name, description, position, questions(count)")
      .eq("subject_id", subjectId)
      .order("position"),
  ])

  if (!subject) notFound()

  type AnswerRow = { status: string; question_id: string; questions: { lesson_id: string | null } | null }
  const answerRows = (answers ?? []) as unknown as AnswerRow[]

  const lessonAnsweredMap = new Map<string, number>()
  for (const a of answerRows) {
    const lid = a.questions?.lesson_id
    if (lid) lessonAnsweredMap.set(lid, (lessonAnsweredMap.get(lid) ?? 0) + 1)
  }

  const lessonsWithQuestions = (lessons ?? [])
    .map((l) => ({
      ...l,
      questionCount: (l.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
      answeredCount: lessonAnsweredMap.get(l.id) ?? 0,
    }))
    .filter((l) => l.questionCount > 0)

  const answered = answerRows.length
  const correct = answerRows.filter((a) => a.status === "correct").length
  const partial = answerRows.filter((a) => a.status === "partial").length
  const wrong = answerRows.filter((a) => a.status === "wrong").length
  const canTakeTest = (questionCount ?? 0) >= 20
  const locale = lang === "ar" ? "ar-MA" : "fr-FR"

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/subjects">
            <ArrowLeft className="h-4 w-4" />
            {t.nav_subjects}
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SubjectLogo name={subject.name} logoUrl={subject.logo_url} icon={subject.icon} className="h-16 w-16 rounded-2xl text-3xl" />
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          {subject.description && (
            <p className="text-muted-foreground text-sm mt-0.5">{subject.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xs:grid-cols-2 sm:grid-cols-4">
        {[
          { label: t.nav_questions, value: questionCount ?? 0 },
          { label: t.stat_correct, value: correct },
          { label: t.stat_partial, value: partial },
          { label: t.stat_incorrect, value: wrong },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Lessons section */}
      {lessonsWithQuestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">{t.lessons_section_title}</h2>
          <div className="flex flex-col gap-2">
            {lessonsWithQuestions.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/subjects/${subjectId}/lessons/${lesson.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">📖 {lesson.name}</p>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lesson.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${lesson.answeredCount === lesson.questionCount && lesson.questionCount > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : ""}`}
                  >
                    {lesson.answeredCount}/{lesson.questionCount}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Full subject practice & test */}
      <div className="space-y-3">
        {lessonsWithQuestions.length > 0 && (
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t.full_subject_section}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                {t.card_practice_title}
              </CardTitle>
              <CardDescription>
                Répondez aux questions une par une. Votre progression est sauvegardée automatiquement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/subjects/${subjectId}/practice`}>
                  {answered > 0 ? t.continue_practice : t.start_practice}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4" />
                {t.card_test_title}
              </CardTitle>
              <CardDescription>
                20 questions aléatoires contre la montre. Score sauvegardé à la fin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canTakeTest ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/subjects/${subjectId}/test`}>{t.start_test}</Link>
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button disabled className="w-full" variant="outline">
                    {t.start_test}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t.need_20_questions} ({questionCount ?? 0} disponibles)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {recentTests && recentTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              {t.recent_tests}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/subjects/${subjectId}/tests`}>{t.see_all}</Link>
            </Button>
          </div>
          <div className="flex flex-col space-y-2">
            {recentTests.map((test) => (
              <Link key={test.id} href={`/tests/${test.id}/review`}>
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground">
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
                  <Badge
                    variant={
                      (test.percentage ?? 0) >= 80
                        ? "success"
                        : (test.percentage ?? 0) >= 50
                          ? "warning"
                          : "error"
                    }
                  >
                    {test.percentage?.toFixed(0) ?? 0}%
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
