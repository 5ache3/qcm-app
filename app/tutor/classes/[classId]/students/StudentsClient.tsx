"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, Trash2, Clock, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { approveStudent, removeStudent } from "../actions"

interface StudentRow {
  studentId: string
  fullName: string
  status: "pending" | "approved"
  joinedAt: string
  subjectsDone: number
  totalAnswered: number
  correct: number
  testsCompleted: number
  avgScore: number | null
}

interface Props {
  classId: string
  students: StudentRow[]
}

export function StudentsClient({ classId, students: initial }: Props) {
  const [students, setStudents] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const pending = students.filter((s) => s.status === "pending")
  const approved = students.filter((s) => s.status === "approved")

  function handleApprove(studentId: string) {
    startTransition(async () => {
      const res = await approveStudent(classId, studentId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Étudiant approuvé")
      setStudents((prev) =>
        prev.map((s) => s.studentId === studentId ? { ...s, status: "approved" } : s)
      )
    })
  }

  function handleRemove(studentId: string, name: string) {
    if (!confirm(`Retirer "${name}" de la classe ?`)) return
    startTransition(async () => {
      const res = await removeStudent(classId, studentId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Étudiant retiré")
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId))
    })
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Aucun étudiant. Partagez le code d&apos;invitation pour qu&apos;ils rejoignent.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            En attente d&apos;approbation
            <Badge variant="warning">{pending.length}</Badge>
          </div>
          {pending.map((s) => (
            <Card key={s.studentId} className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    Demande le {new Date(s.joinedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleApprove(s.studentId)}
                  >
                    <Check className="h-3.5 w-3.5 me-1.5" />
                    Approuver
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleRemove(s.studentId, s.fullName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground">Étudiants approuvés</p>
          )}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Nom</th>
                  <th className="text-center px-3 py-2.5 hidden sm:table-cell">Matières</th>
                  <th className="text-center px-3 py-2.5 hidden md:table-cell">Réponses</th>
                  <th className="text-center px-3 py-2.5 hidden md:table-cell">Correct</th>
                  <th className="text-center px-3 py-2.5 hidden sm:table-cell">Tests</th>
                  <th className="text-center px-3 py-2.5">Moy.</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {approved.map((s) => (
                  <tr key={s.studentId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tutor/classes/${classId}/students/${s.studentId}`}
                        className="font-medium hover:text-primary flex items-center gap-1 group"
                      >
                        {s.fullName}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      {s.subjectsDone > 0 ? (
                        <Badge variant="secondary">{s.subjectsDone}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden md:table-cell">
                      {s.totalAnswered || "—"}
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      {s.totalAnswered > 0 ? (
                        <span className={s.correct / s.totalAnswered >= 0.7 ? "text-green-600" : "text-muted-foreground"}>
                          {s.correct}/{s.totalAnswered}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">
                      {s.testsCompleted || "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {s.avgScore !== null ? (
                        <Badge variant={s.avgScore >= 70 ? "success" : s.avgScore >= 50 ? "warning" : "destructive"}>
                          {s.avgScore}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleRemove(s.studentId, s.fullName)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
