"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getTutorLessonsForSubject,
  createTutorLesson,
  updateTutorLesson,
  deleteTutorLesson,
} from "./actions"

type Lesson = { id: string; name: string; description: string | null; position: number }

interface Props {
  classId: string
  subjectId: string
}

export function TutorLessonsManager({ classId, subjectId }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")

  async function load() {
    if (loaded) return
    setLoading(true)
    const data = await getTutorLessonsForSubject(subjectId)
    setLessons(data as Lesson[])
    setLoaded(true)
    setLoading(false)
  }

  function handleAdd() {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createTutorLesson(classId, subjectId, { name: newName.trim(), description: newDesc.trim() })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Cours ajouté")
      setNewName(""); setNewDesc(""); setShowAdd(false)
      const data = await getTutorLessonsForSubject(subjectId)
      setLessons(data as Lesson[])
    })
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id)
    setEditName(lesson.name)
    setEditDesc(lesson.description ?? "")
  }

  function handleSave(lessonId: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      const res = await updateTutorLesson(classId, lessonId, { name: editName.trim(), description: editDesc.trim() })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Cours mis à jour")
      setLessons((prev) =>
        prev.map((l) => l.id === lessonId ? { ...l, name: editName.trim(), description: editDesc.trim() || null } : l)
      )
      setEditingId(null)
    })
  }

  function handleDelete(lessonId: string) {
    if (!confirm("Supprimer ce cours ?")) return
    startTransition(async () => {
      const res = await deleteTutorLesson(classId, lessonId)
      if (res?.error) { toast.error(res.error); return }
      toast.success("Cours supprimé")
      setLessons((prev) => prev.filter((l) => l.id !== lessonId))
    })
  }

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <button
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={load}
        >
          {loaded ? "Cours" : "▸ Cours"}
        </button>
        {loaded && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAdd(true); setEditingId(null) }}>
            <Plus className="h-3 w-3 me-1" />
            Ajouter
          </Button>
        )}
      </div>

      {!loaded && (
        <button className="text-xs text-muted-foreground hover:underline" onClick={load}>
          {loading ? "…" : "Afficher les cours"}
        </button>
      )}

      {loaded && (
        <>
          {lessons.length === 0 && !showAdd && (
            <p className="text-xs text-muted-foreground">Aucun cours pour l&apos;instant.</p>
          )}
          <div className="space-y-1.5">
            {lessons.map((lesson) => {
              const isEditing = editingId === lesson.id
              return (
                <div key={lesson.id} className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm transition-colors hover:bg-primary-soft/60">
                  {isEditing ? (
                    <>
                      <div className="flex-1 space-y-1.5">
                        <Input className="h-7 text-xs" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom du cours" />
                        <Input className="h-7 text-xs" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-green-600" disabled={isPending} onClick={() => handleSave(lesson.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">📖 {lesson.name}</p>
                        {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={() => startEdit(lesson)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" disabled={isPending} onClick={() => handleDelete(lesson.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
          {showAdd && (
            <div className="flex items-start gap-2 rounded-xl border border-dashed border-primary/50 bg-primary-soft/30 px-3 py-2">
              <div className="flex-1 space-y-1.5">
                <Input className="h-7 text-xs" placeholder="Nom du cours" value={newName} autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setShowAdd(false); setNewName(""); setNewDesc("") } }}
                />
                <Input className="h-7 text-xs" placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-green-600" disabled={isPending} onClick={handleAdd}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setShowAdd(false); setNewName(""); setNewDesc("") }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
