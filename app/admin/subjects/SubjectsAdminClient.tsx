"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createSubject, deleteSubject } from "./actions"

interface Subject {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

interface Props {
  subjects: Subject[]
  questionCountMap: Record<string, number>
}

export function SubjectsAdminClient({ subjects: initial, questionCountMap }: Props) {
  const [subjects, setSubjects] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createSubject(formData)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Subject created")
      setShowForm(false)
      // Reload subjects from server by refreshing the route
      window.location.reload()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its questions? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteSubject(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Subject deleted")
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "New subject"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" placeholder="e.g. Mathematics" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <Input id="icon" name="icon" placeholder="📐" maxLength={4} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optional short description" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create subject"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookMarked className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No subjects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
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
          ))}
        </div>
      )}
    </div>
  )
}
