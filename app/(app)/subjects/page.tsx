import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import Link from "next/link"
import { BookMarked, ChevronRight, Calendar, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

function sortSubjectsByDueDate<T extends { due_date: string | null }>(subjects: T[]): T[] {
  const today = new Date()

  return [...subjects].sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date + "T12:00:00") : null
    const db = b.due_date ? new Date(b.due_date + "T12:00:00") : null
    const aPast = da ? da < today : false
    const bPast = db ? db < today : false

    // past due → bottom
    if (aPast !== bPast) return aPast ? 1 : -1
    // both upcoming with date → soonest first
    if (da && db && !aPast && !bPast) return da.getTime() - db.getTime()
    // no date → after upcoming, before past
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    // both past → most recently expired first
    return db.getTime() - da.getTime()
  })
}

export default async function SubjectsPage() {
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawSubjects } = await supabase
    .from("subjects")
    .select("id, name, description, icon, due_date, class_id, classes(name), questions!inner(id)")

  const allSubjects = rawSubjects ?? []

  const { data: practiceAnswers } = await supabase
    .from("practice_answers")
    .select("subject_id, score, status")
    .eq("user_id", user!.id)

  function getSubjectProgress(subjectId: string) {
    const answers = practiceAnswers?.filter((a) => a.subject_id === subjectId) ?? []
    const correct = answers.filter((a) => a.status === "correct").length
    return { answered: answers.length, correct }
  }

  // Group by class_id, preserving class name. null class_id → "Général"
  const groupMap = new Map<string | null, { className: string | null; subjects: typeof allSubjects }>()
  for (const s of allSubjects) {
    const key = s.class_id ?? null
    if (!groupMap.has(key)) {
      groupMap.set(key, { className: (s as any).classes?.name ?? null, subjects: [] })
    }
    groupMap.get(key)!.subjects.push(s)
  }

  // Sort each group's subjects by due date
  const groups = [...groupMap.entries()].map(([classId, group]) => ({
    classId,
    className: group.className,
    subjects: sortSubjectsByDueDate(group.subjects),
  }))

  // Class groups first (sorted by name), then the no-class group last
  groups.sort((a, b) => {
    if (a.classId === null) return 1
    if (b.classId === null) return -1
    return (a.className ?? "").localeCompare(b.className ?? "")
  })

  if (allSubjects.length === 0) {
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

  function SubjectCard({ subject }: { subject: (typeof allSubjects)[number] }) {
    const { answered, correct } = getSubjectProgress(subject.id)
    const progressPct = answered > 0 ? Math.round((correct / answered) * 100) : 0
    const today = new Date()
    const dueDate = subject.due_date ? new Date(subject.due_date + "T12:00:00") : null
    const isPastDue = dueDate ? dueDate < today : false
    const daysUntilDue = dueDate ? Math.round((dueDate.getTime() - today.getTime()) / 86400000) : null

    return (
      <Link href={`/subjects/${subject.id}`}>
        <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer group ${isPastDue ? "opacity-60" : ""}`}>
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
              <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
            )}
            {dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {isPastDue ? (
                  <span className="text-xs text-destructive font-medium">
                    Expiré le {dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                ) : daysUntilDue === 0 ? (
                  <span className="text-xs text-orange-500 font-medium">Aujourd&apos;hui</span>
                ) : daysUntilDue === 1 ? (
                  <span className="text-xs text-orange-500 font-medium">Demain</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Dans {daysUntilDue} jours — {dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
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
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.subjects_title}</h1>
        <p className="text-muted-foreground mt-1">Choisissez une matière pour vous entraîner ou vous tester.</p>
      </div>

      {groups.map((group) => (
        <section key={group.classId ?? "__global__"} className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.className ?? "Général"}
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
