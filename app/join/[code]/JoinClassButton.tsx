"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { joinClass } from "@/app/(app)/profile/actions"

interface Props {
  code: string
  alreadyPending: boolean
}

export function JoinClassButton({ code, alreadyPending }: Props) {
  const [requested, setRequested] = useState(alreadyPending)
  const [isPending, startTransition] = useTransition()

  function handleJoin() {
    startTransition(async () => {
      const res = await joinClass(code)
      if (res?.error) { toast.error(res.error); return }
      toast.success("Demande envoyée. En attente d'approbation.")
      setRequested(true)
    })
  }

  if (requested) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          Demande envoyée. Votre enseignant doit l&apos;approuver.
        </p>
        <Button asChild variant="outline" className="w-full"><Link href="/dashboard">Aller au tableau de bord</Link></Button>
      </div>
    )
  }

  return (
    <Button className="w-full" disabled={isPending} onClick={handleJoin}>
      {isPending ? "Envoi…" : "Demander à rejoindre"}
    </Button>
  )
}
