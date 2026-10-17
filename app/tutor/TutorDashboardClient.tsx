"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { GraduationCap, Users, BookMarked, Plus, ChevronRight, Copy, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClassCover } from "@/components/ClassCover"
import { ImageUploadButton } from "@/components/ImageUploadButton"
import { createClass, deleteClass } from "./actions"

interface ClassRow {
  id: string
  name: string
  description: string | null
  invite_code: string
  cover_url: string | null
  created_at: string
  memberCount: number
  pendingCount: number
  subjectCount: number
}

interface Props {
  classes: ClassRow[]
  mcpTokensCard: React.ReactNode
}

export function TutorDashboardClient({ classes: initial, mcpTokensCard }: Props) {
  const router = useRouter()
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const classes = initial.filter((c) => !deletedIds.includes(c.id))
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createClass(formData)
      if (res.error) { toast.error(res.error); return }
      toast.success("Classe créée avec succès")
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDelete(classId: string, name: string) {
    if (!confirm(`Supprimer la classe "${name}" ? Toutes les données associées seront perdues.`)) return
    startTransition(async () => {
      const res = await deleteClass(classId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Classe supprimée")
      setDeletedIds((prev) => [...prev, classId])
    })
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success("Code copié !")
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            Mes classes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez vos classes, invitez des étudiants et créez du contenu.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4 me-2" />
          {showForm ? "Annuler" : "Nouvelle classe"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Créer une classe</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la classe *</Label>
                <Input id="name" name="name" placeholder="ex. Terminale S1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optionnelle" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "…" : "Créer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 text-center py-16 text-muted-foreground">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
            <GraduationCap className="h-7 w-7" />
          </span>
          <p className="font-medium">Aucune classe pour l&apos;instant.</p>
          <p className="text-sm mt-1">Créez votre première classe pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="group overflow-hidden transition-all hover:shadow-lift">
              <ClassCover name={cls.name} coverUrl={cls.cover_url} className="h-32">
                                <ImageUploadButton
                  target="class-cover"
                  ownerId={cls.id}
                  currentUrl={cls.cover_url}
                  className="absolute end-2 top-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                />
              </ClassCover>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">
                    <Link href={`/tutor/classes/${cls.id}`} className="hover:text-primary transition-colors">
                      {cls.name}
                    </Link>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={isPending}
                    onClick={() => handleDelete(cls.id, cls.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {cls.description && (
                  <p className="text-xs text-muted-foreground">{cls.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {cls.memberCount} étudiant{cls.memberCount !== 1 ? "s" : ""}
                  </span>
                  {cls.pendingCount > 0 && (
                    <Badge variant="warning" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {cls.pendingCount} en attente
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <BookMarked className="h-3.5 w-3.5" />
                    {cls.subjectCount} matière{cls.subjectCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <button
                  onClick={() => copyCode(cls.invite_code)}
                  className="flex items-center gap-2 w-full rounded-xl bg-muted px-3 py-2 text-xs font-mono hover:bg-accent transition-colors"
                >
                  <span className="text-muted-foreground">Code :</span>
                  <span className="font-semibold tracking-widest">{cls.invite_code}</span>
                  <Copy className="h-3 w-3 ms-auto text-muted-foreground" />
                </button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/tutor/classes/${cls.id}/students`}>
                      <Users className="h-3.5 w-3.5 me-1.5" />
                      Étudiants
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/tutor/classes/${cls.id}/subjects`}>
                      <BookMarked className="h-3.5 w-3.5 me-1.5" />
                      Matières
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mcpTokensCard}
    </div>
  )
}
