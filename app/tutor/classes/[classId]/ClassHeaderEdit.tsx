"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateClassDetails } from "./actions"

interface Props {
  classId: string
  name: string
  description: string | null
}

export function ClassHeaderEdit({ classId, name: initialName, description: initialDesc }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDesc ?? "")
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    setName(initialName)
    setDescription(initialDesc ?? "")
    setEditing(false)
  }

  function handleSave() {
    if (!name.trim()) return
    startTransition(async () => {
      const res = await updateClassDetails(classId, name, description)
      if (res?.error) { toast.error(res.error); return }
      toast.success("Classe mise à jour.")
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex-1 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la classe"
          className="text-lg font-bold h-10"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending || !name.trim()} onClick={handleSave} className="gap-1">
            <Check className="h-3.5 w-3.5" />
            Enregistrer
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1">
            <X className="h-3.5 w-3.5" />
            Annuler
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 flex-1">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{name}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 mt-0.5"
        onClick={() => setEditing(true)}
        title="Modifier les détails"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}
