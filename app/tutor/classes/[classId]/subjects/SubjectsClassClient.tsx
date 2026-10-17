"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2, BookMarked, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClassSubject, deleteClassSubject, updateClassSubject } from "./actions"
import { TutorLessonsManager } from "./TutorLessonsManager"
import { SubjectLogo } from "@/components/SubjectLogo"
import { ImageUploadButton } from "@/components/ImageUploadButton"

interface Subject {
  id: string
  name: string
  description: string | null
  icon: string | null
  logo_url: string | null
  due_date: string | null
  created_at: string
}

interface Props {
  classId: string
  subjects: Subject[]
  questionCountMap: Record<string, number>
}

type EditingState = { name: string; description: string; icon: string; due_date: string }

export function SubjectsClassClient({ classId, subjects: initial, questionCountMap }: Props) {
  const [subjects, setSubjects] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<EditingState>({ name: "", description: "", icon: "", due_date: "" })
  const [isPending, startTransition] = useTransition()

  function startEdit(s: Subject) {
    setEditingId(s.id)
    setEditFields({ name: s.name, description: s.description ?? "", icon: s.icon ?? "", due_date: s.due_date ?? "" })
  }

  function cancelEdit() { setEditingId(null) }

  function handleSave(id: string) {
    startTransition(async () => {
      const res = await updateClassSubject(classId, id, {
        name: editFields.name,
        description: editFields.description,
        icon: editFields.icon,
        due_date: editFields.due_date || null,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Matière mise à jour")
      setSubjects((prev) => prev.map((s) => s.id === id
        ? { ...s, name: editFields.name.trim(), description: editFields.description.trim() || null, icon: editFields.icon.trim() || null, due_date: editFields.due_date || null }
        : s
      ))
      setEditingId(null)
    })
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createClassSubject(classId, formData)
      if (res.error) { toast.error(res.error); return }
      toast.success("Matière créée")
      setShowForm(false)
      window.location.reload()
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Matières de la classe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subjects.length} matière{subjects.length !== 1 ? "s" : ""} · ajoutez un logo, des cours et des questions
          </p>
        </div>
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
        <div className="rounded-2xl border border-dashed bg-card/60 text-center py-14 text-muted-foreground">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
            <BookMarked className="h-7 w-7" />
          </span>
          <p>Aucune matière. Créez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-start">
          {subjects.map((subject) => {
            const isEditing = editingId === subject.id
            return (
              <div key={subject.id} className="rounded-2xl border bg-card p-5 space-y-4 shadow-soft transition-shadow hover:shadow-lift">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                      <div className="space-y-1">
                        <Label className="text-xs">Emoji</Label>
                        <Input
                          value={editFields.icon}
                          onChange={(e) => setEditFields((f) => ({ ...f, icon: e.target.value }))}
                          placeholder="📚"
                          maxLength={4}
                          className="w-16 text-center text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nom *</Label>
                        <Input
                          value={editFields.name}
                          onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Nom de la matière"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={editFields.description}
                        onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description (optionnelle)"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date limite</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={editFields.due_date}
                          onChange={(e) => setEditFields((f) => ({ ...f, due_date: e.target.value }))}
                          className="w-44"
                        />
                        {editFields.due_date && (
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setEditFields((f) => ({ ...f, due_date: "" }))}>
                            <X className="h-4 w-4 me-1" />Effacer
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={isPending || !editFields.name.trim()} onClick={() => handleSave(subject.id)} className="gap-1">
                        <Check className="h-3.5 w-3.5" />Enregistrer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="gap-1">
                        <X className="h-3.5 w-3.5" />Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SubjectLogo name={subject.name} logoUrl={subject.logo_url} icon={subject.icon} className="h-12 w-12" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{subject.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {subject.description && (
                            <p className="text-sm text-muted-foreground truncate">{subject.description}</p>
                          )}
                          {subject.due_date && (
                            <p className="text-xs text-muted-foreground">
                              📅 {new Date(subject.due_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">{questionCountMap[subject.id] ?? 0} question{(questionCountMap[subject.id] ?? 0) !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ImageUploadButton target="subject-logo" ownerId={subject.id} currentUrl={subject.logo_url} variant="plain" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => startEdit(subject)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(subject.id, subject.name)} disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <TutorLessonsManager classId={classId} subjectId={subject.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
