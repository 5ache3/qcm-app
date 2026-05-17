import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BookOpen, Timer, History, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params
  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: subject }, { count: questionCount }, { data: answers }, { data: recentTests }] =
    await Promise.all([
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId),
      supabase
        .from("practice_answers")
        .select("status")
        .eq("user_id", user!.id)
        .eq("subject_id", subjectId),
      supabase
        .from("tests")
        .select("id, started_at, percentage, status")
        .eq("user_id", user!.id)
        .eq("subject_id", subjectId)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(3),
    ])

  if (!subject) notFound()

  const answered = answers?.length ?? 0
  const correct = answers?.filter((a) => a.status === "correct").length ?? 0
  const partial = answers?.filter((a) => a.status === "partial").length ?? 0
  const wrong = answers?.filter((a) => a.status === "wrong").length ?? 0
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
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
          {subject.icon ?? "📚"}
        </div>
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
          <div className="space-y-2">
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
