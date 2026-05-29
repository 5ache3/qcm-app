"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClassSubject, deleteClassSubject, updateClassSubjectDueDate } from "./actions"
import { TutorLessonsManager } from "./TutorLessonsManager"

interface Subject {
  id: string
  name: string
  description: string | null
  icon: string | null
  due_date: string | null
  created_at: string
}

interface Props {
  classId: string
  subjects: Subject[]
  questionCountMap: Record<string, number>
}

export function SubjectsClassClient({ classId, subjects: initial, questionCountMap }: Props) {
  const [subjects, setSubjects] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createClassSubject(classId, formData)
      if (res.error) { toast.error(res.error); return }
      toast.success("Matière créée")
      setShowForm(false)
      window.location.reload()
    })
  }

  function handleDueDateChange(id: string, value: string) {
    startTransition(async () => {
      const res = await updateClassSubjectDueDate(classId, id, value || null)
      if (res.error) { toast.error(res.error); return }
      setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, due_date: value || null } : s))
      toast.success("Date limite mise à jour")
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ? Toutes les questions associées seront supprimées.`)) return
    startTransition(async () => {
      const res = await deleteClassSubject(classId, id)
      if (res.error) { toast.error(res.error); return }
      toast.success("Matière supprimée")
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Matières de la classe</h1>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4 me-2" />
          {showForm ? "Annuler" : "Nouvelle matière"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nouvelle matière</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input id="name" name="name" placeholder="ex. Mathématiques" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Emoji</Label>
                  <Input id="icon" name="icon" placeholder="📐" maxLength={4} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Courte description (optionnelle)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date limite (optionnelle)</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "…" : "Créer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookMarked className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune matière. Créez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon ?? "📚"}</span>
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground">{subject.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`due-${subject.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                      Date limite
                    </Label>
                    <Input
                      id={`due-${subject.id}`}
                      type="date"
                      className="h-7 w-36 text-xs cursor-pointer"
                      defaultValue={subject.due_date ?? ""}
                      disabled={isPending}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      onChange={(e) => handleDueDateChange(subject.id, e.target.value)}
                    />
                  </div>
                  <Badge variant="outline">
                    {questionCountMap[subject.id] ?? 0} questions
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(subject.id, subject.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <TutorLessonsManager classId={classId} subjectId={subject.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
