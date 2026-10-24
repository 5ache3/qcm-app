"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  GraduationCap, Clock, ChevronRight, Plus, X, BookMarked, ArrowLeft,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinClass } from "@/app/(app)/profile/actions"
import { ClassCover } from "@/components/ClassCover"
import { SubjectLogo } from "@/components/SubjectLogo"

interface SubjectRow {
  id: string
  name: string
  icon: string | null
  logo_url: string | null
  due_date: string | null
}

interface ClassRow {
  classId: string
  className: string
  coverUrl: string | null
  status: "pending" | "approved"
  subjects: SubjectRow[]
}

interface Props {
  classes: ClassRow[]
  openClassId?: string
}

export function ClassesSection({ classes: initial, openClassId }: Props) {
  const [classes, setClasses] = useState(initial)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(openClassId ?? null)
  const [code, setCode] = useState("")
  const [showJoin, setShowJoin] = useState(false)
  const [isPending, startTransition] = useTransition()

  const approved = classes.filter((c) => c.status === "approved")
  const pending = classes.filter((c) => c.status === "pending")
  const selectedClass = approved.find((c) => c.classId === selectedClassId) ?? null

  function handleJoin() {
    if (!code.trim()) return
    startTransition(async () => {
      const res = await joinClass(code.trim())
      if (res?.error) { toast.error(res.error); return }
      toast.success(`Demande envoyée pour "${res.className}". En attente d'approbation.`)
      setClasses((prev) => [
        ...prev,
        { classId: crypto.randomUUID(), className: res.className!, coverUrl: null, status: "pending", subjects: [] },
      ])
      setCode("")
      setShowJoin(false)
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {selectedClass ? (
              <button
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
                onClick={() => setSelectedClassId(null)}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {selectedClass.className}
              </button>
            ) : (
              "Mes classes"
            )}
          </CardTitle>
          {!selectedClass && (
            <Button
              size="sm"
              variant={showJoin ? "ghost" : "outline"}
              className="h-7 text-xs gap-1"
              onClick={() => { setShowJoin((v) => !v); setCode("") }}
            >
              {showJoin ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showJoin ? "Annuler" : "Rejoindre"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Join form */}
        {showJoin && !selectedClass && (
          <div className="flex gap-2">
            <Input
              placeholder="Code d'invitation (ex. abc12345)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="font-mono text-sm h-9"
              autoFocus
            />
            <Button size="sm" disabled={isPending || !code.trim()} onClick={handleJoin} className="shrink-0">
              {isPending ? "…" : "Rejoindre"}
            </Button>
          </div>
        )}

        {/* No classes at all */}
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Vous n&apos;êtes inscrit dans aucune classe. Utilisez le bouton &quot;Rejoindre&quot; pour en rejoindre une.
          </p>
        )}

        {/* Class picker (step 1) */}
        {!selectedClass && (
          <div className="space-y-3">
            {approved.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {approved.map((c) => (
                  <button
                    key={c.classId}
                    onClick={() => setSelectedClassId(c.classId)}
                    className="group overflow-hidden rounded-2xl border bg-card text-start shadow-soft transition-all hover:shadow-lift"
                  >
                    <ClassCover name={c.className} coverUrl={c.coverUrl} className="h-24">
                                          </ClassCover>
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.className}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.subjects.length} matière{c.subjects.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {pending.length > 0 && (
              <div className="space-y-1.5">
                {approved.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">En attente</p>
                )}
                {pending.map((c) => (
                  <div
                    key={c.classId}
                    className="flex items-center justify-between rounded-xl border border-dashed px-4 py-3 opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium">{c.className}</p>
                    </div>
                    <Badge variant="warning" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      En attente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subject picker (step 2) */}
        {selectedClass && (
          <div className="space-y-2">
            {selectedClass.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune matière dans cette classe pour l&apos;instant.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedClass.subjects.map((s) => {
                  const today = new Date()
                  const dueDate = s.due_date ? new Date(s.due_date + "T12:00:00") : null
                  const isPastDue = dueDate ? dueDate < today : false
                  const daysUntilDue = dueDate
                    ? Math.round((dueDate.getTime() - today.getTime()) / 86400000)
                    : null

                  return (
                    <Link key={s.id} href={`/subjects/${s.id}`}>
                      <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft transition-all hover:shadow-lift group ${isPastDue ? "opacity-60" : ""}`}>
                        <SubjectLogo name={s.name} logoUrl={s.logo_url} icon={s.icon} className="h-10 w-10 text-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          {dueDate && (
                            <p className={`text-xs mt-0.5 ${isPastDue ? "text-destructive" : "text-muted-foreground"}`}>
                              {isPastDue
                                ? `Expiré le ${dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                                : daysUntilDue === 0
                                  ? "Aujourd'hui"
                                  : `Dans ${daysUntilDue} j`}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
