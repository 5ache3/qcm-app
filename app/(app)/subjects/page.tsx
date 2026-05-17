import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import Link from "next/link"
import { BookMarked, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default async function SubjectsPage() {
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, description, icon, questions!inner(id)")
    .order("name")

  const { data: practiceAnswers } = await supabase
    .from("practice_answers")
    .select("subject_id, score, status")
    .eq("user_id", user!.id)

  function getSubjectProgress(subjectId: string) {
    const answers = practiceAnswers?.filter((a) => a.subject_id === subjectId) ?? []
    const correct = answers.filter((a) => a.status === "correct").length
    return { answered: answers.length, correct }
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Aucune matière disponible</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Demandez à votre administrateur d&apos;ajouter des matières et des questions.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.subjects_title}</h1>
        <p className="text-muted-foreground mt-1">Choisissez une matière pour vous entraîner ou vous tester.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const { answered, correct } = getSubjectProgress(subject.id)
          const progressPct = answered > 0 ? Math.round((correct / answered) * 100) : 0

          return (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                        {subject.icon ?? "📚"}
                      </div>
                      <CardTitle className="text-base">{subject.name}</CardTitle>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                  {answered > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{answered} {t.answered_label}</span>
                        <span>{progressPct}% {t.stat_correct.toLowerCase()}</span>
                      </div>
                      <Progress value={progressPct} className="h-1.5" />
                    </div>
                  ) : (
                    <Badge variant="muted" className="text-xs">{t.not_started}</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
