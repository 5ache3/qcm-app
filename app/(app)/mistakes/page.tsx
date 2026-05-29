import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import Link from "next/link"
import { AlertCircle, Calendar, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type SubjectEntry = {
  subject: { id: string; name: string; icon: string | null; due_date: string | null; class_id: string | null; class_name: string | null }
  wrong: number
  partial: number
}

function sortByDueDate(subjects: SubjectEntry[]): SubjectEntry[] {
  const today = new Date()
  return [...subjects].sort((a, b) => {
    const da = a.subject.due_date ? new Date(a.subject.due_date + "T12:00:00") : null
    const db = b.subject.due_date ? new Date(b.subject.due_date + "T12:00:00") : null
    const aPast = da ? da < today : false
    const bPast = db ? db < today : false

    if (aPast !== bPast) return aPast ? 1 : -1
    if (da && db && !aPast && !bPast) return da.getTime() - db.getTime()
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return db.getTime() - da.getTime()
  })
}

export default async function MistakesPage() {
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: answers } = await supabase
    .from("practice_answers")
    .select("subject_id, status, subjects(id, name, icon, due_date, class_id, classes(name))")
    .eq("user_id", user!.id)
    .in("status", ["wrong", "partial"])

  if (!answers || answers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-lg font-semibold">Aucune erreur pour l&apos;instant</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Les réponses incorrectes et partielles de l&apos;entraînement apparaîtront ici.
        </p>
        <Button asChild className="mt-4">
          <Link href="/subjects">{t.start_practice}</Link>
        </Button>
      </div>
    )
  }

  const bySubject = new Map<string, SubjectEntry>()
  for (const a of answers) {
    const raw = a.subjects as unknown as { id: string; name: string; icon: string | null; due_date: string | null; class_id: string | null; classes: { name: string } | null } | null
    if (!raw) continue
    const sub = { ...raw, class_name: raw.classes?.name ?? null }
    if (!bySubject.has(sub.id)) {
      bySubject.set(sub.id, { subject: sub, wrong: 0, partial: 0 })
    }
    const entry = bySubject.get(sub.id)!
    if (a.status === "wrong") entry.wrong++
    else entry.partial++
  }

  const today = new Date()
  const allEntries = sortByDueDate(Array.from(bySubject.values()))

  // Group by class
  const groupMap = new Map<string | null, { className: string | null; entries: SubjectEntry[] }>()
  for (const entry of allEntries) {
    const key = entry.subject.class_id ?? null
    if (!groupMap.has(key)) {
      groupMap.set(key, { className: entry.subject.class_name, entries: [] })
    }
    groupMap.get(key)!.entries.push(entry)
  }

  const groups = [...groupMap.entries()]
    .map(([classId, group]) => ({ classId, className: group.className, entries: group.entries }))
    .sort((a, b) => {
      if (a.classId === null) return 1
      if (b.classId === null) return -1
      return (a.className ?? "").localeCompare(b.className ?? "")
    })

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t.mistakes_title}</h1>
        <p className="text-muted-foreground mt-1">
          {answers.length} {t.to_review_count} ({allEntries.length} {t.nav_subjects.toLowerCase()})
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.classId ?? "__global__"} className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.className ?? "Général"}
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          {group.entries.map(({ subject, wrong, partial }) => {
            const dueDate = subject.due_date ? new Date(subject.due_date + "T12:00:00") : null
            const isPastDue = dueDate ? dueDate < today : false
            const daysUntilDue = dueDate ? Math.round((dueDate.getTime() - today.getTime()) / 86400000) : null

            return (
              <Link key={subject.id} href={`/mistakes/${subject.id}`}>
                <Card className={`hover:bg-muted/40 transition-colors cursor-pointer ${isPastDue ? "opacity-60" : ""}`}>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{subject.icon ?? "📚"}</span>
                      <div className="min-w-0">
                        <span className="font-medium">{subject.name}</span>
                        {dueDate && (
                          <div className={`flex items-center gap-1 text-xs mt-0.5 ${isPastDue ? "text-destructive" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3 shrink-0" />
                            {isPastDue
                              ? `Expiré le ${dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                              : daysUntilDue === 0
                                ? "Aujourd'hui"
                                : `Dans ${daysUntilDue} j — ${dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {wrong > 0 && (
                        <Badge variant="error">{wrong} {t.stat_incorrect.toLowerCase()}</Badge>
                      )}
                      {partial > 0 && (
                        <Badge variant="warning">{partial} {t.stat_partial.toLowerCase()}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </section>
      ))}
    </div>
  )
}
