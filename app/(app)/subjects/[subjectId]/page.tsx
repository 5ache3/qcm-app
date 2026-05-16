import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()
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
  const unanswered = (questionCount ?? 0) - answered
  const canTakeTest = (questionCount ?? 0) >= 20

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/subjects">
            <ArrowLeft className="h-4 w-4" />
            Subjects
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Questions", value: questionCount ?? 0, variant: "outline" as const },
          { label: "Correct", value: correct, variant: "success" as const },
          { label: "Partial", value: partial, variant: "warning" as const },
          { label: "Wrong", value: wrong, variant: "error" as const },
        ].map(({ label, value, variant }) => (
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
              Practice Mode
            </CardTitle>
            <CardDescription>
              Answer questions one by one. Your progress is saved automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/subjects/${subjectId}/practice`}>
                {answered > 0 ? "Continue practising" : "Start practising"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4" />
              Timed Test
            </CardTitle>
            <CardDescription>
              20 random questions against the clock. Score saved at the end.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canTakeTest ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/subjects/${subjectId}/test`}>Start test</Link>
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full" variant="outline">
                  Start test
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Needs at least 20 questions ({questionCount ?? 0} available)
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
              Recent Tests
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/subjects/${subjectId}/tests`}>View all</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentTests.map((test) => (
              <Link key={test.id} href={`/tests/${test.id}/review`}>
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground">
                    {new Date(test.started_at).toLocaleDateString()}
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
