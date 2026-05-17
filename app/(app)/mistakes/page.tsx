import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function MistakesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get counts of wrong/partial answers per subject
  const { data: answers } = await supabase
    .from("practice_answers")
    .select("subject_id, status, subjects(id, name, icon)")
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
          <Link href="/subjects">Commencer l&apos;entraînement</Link>
        </Button>
      </div>
    )
  }

  // Group by subject
  const bySubject = new Map<string, { subject: { id: string; name: string; icon: string | null }; wrong: number; partial: number }>()
  for (const a of answers) {
    const sub = a.subjects as any
    if (!bySubject.has(sub.id)) {
      bySubject.set(sub.id, { subject: sub, wrong: 0, partial: 0 })
    }
    const entry = bySubject.get(sub.id)!
    if (a.status === "wrong") entry.wrong++
    else entry.partial++
  }

  const subjects = Array.from(bySubject.values()).sort(
    (a, b) => (b.wrong + b.partial) - (a.wrong + a.partial)
  )

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Erreurs</h1>
        <p className="text-muted-foreground mt-1">
          {answers.length} question{answers.length !== 1 ? "s" : ""} à revoir dans{" "}
          {subjects.length} matière{subjects.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {subjects.map(({ subject, wrong, partial }) => (
          <Link key={subject.id} href={`/mistakes/${subject.id}`}>
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon ?? "📚"}</span>
                  <span className="font-medium">{subject.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wrong > 0 && (
                    <Badge variant="error">{wrong} incorrect{wrong > 1 ? "es" : "e"}</Badge>
                  )}
                  {partial > 0 && (
                    <Badge variant="warning">{partial} partielle{partial > 1 ? "s" : ""}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
