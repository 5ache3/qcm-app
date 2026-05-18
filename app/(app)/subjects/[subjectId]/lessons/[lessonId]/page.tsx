import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, Timer, History, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ subjectId: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  const { subjectId, lessonId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: lesson }, { data: subject }, { data: lessonQuestions }, { data: recentTests }] =
    await Promise.all([
      supabase.from("lessons").select("*").eq("id", lessonId).eq("subject_id", subjectId).single(),
      supabase.from("subjects").select("id, name, icon").eq("id", subjectId).single(),
      supabase
        .from("questions")
        .select("id")
        .eq("subject_id", subjectId)
        .eq("lesson_id", lessonId),
      supabase
        .from("tests")
        .select("id, started_at, percentage, status")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(3),
    ])

  if (!lesson || !subject) notFound()

  const questionIds = lessonQuestions?.map((q) => q.id) ?? []
  const questionCount = questionIds.length

  let answeredCount = 0
  let correctCount = 0
  if (questionIds.length > 0) {
    const { data: answers } = await supabase
      .from("practice_answers")
      .select("status")
      .eq("user_id", user!.id)
      .in("question_id", questionIds)
    answeredCount = answers?.length ?? 0
    correctCount = answers?.filter((a) => a.status === "correct").length ?? 0
  }

  const canTakeTest = questionCount >= 20
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

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {t.lesson_label}
        </p>
        <h1 className="text-2xl font-bold">📖 {lesson.name}</h1>
        {lesson.description && (
          <p className="text-muted-foreground text-sm mt-0.5">{lesson.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.nav_questions, value: questionCount },
          { label: t.answered_label, value: answeredCount },
          { label: t.stat_correct, value: correctCount },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              {t.card_practice_title}
            </CardTitle>
            <CardDescription>
              Répondez aux questions de ce cours. Progression sauvegardée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questionCount > 0 ? (
              <Button asChild className="w-full">
                <Link href={`/subjects/${subjectId}/lessons/${lessonId}/practice`}>
                  {answeredCount > 0 ? t.continue_practice : t.start_practice}
                </Link>
              </Button>
            ) : (
              <Button disabled className="w-full">
                {t.start_practice}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4" />
              {t.card_test_title}
            </CardTitle>
            <CardDescription>
              20 questions de ce cours contre la montre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canTakeTest ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/subjects/${subjectId}/lessons/${lessonId}/test`}>{t.start_test}</Link>
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full" variant="outline">
                  {t.start_test}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t.need_20_questions} ({questionCount} disponibles)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recentTests && recentTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              {t.recent_tests}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/subjects/${subjectId}/lessons/${lessonId}/tests`}>{t.see_all}</Link>
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
