"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, Link2, RefreshCw } from "lucide-react"
import { rotateInviteCode } from "./actions"

interface Props {
  classId: string
  code: string
}

export function ClassInviteCode({ classId, code: initialCode }: Props) {
  const [code, setCode] = useState(initialCode)
  const [isPending, startTransition] = useTransition()

  function handleCopy() {
    navigator.clipboard.writeText(code)
    toast.success("Code copié !")
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`)
    toast.success("Lien d'invitation copié !")
  }

  function handleRotate() {
    startTransition(async () => {
      const res = await rotateInviteCode(classId)
      if (res?.error) { toast.error(res.error); return }
      setCode(res.code!)
      toast.success("Nouveau code généré.")
    })
  }

  return (
    <div className="flex items-stretch gap-2 w-full max-w-sm">
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 flex-1 rounded-lg border bg-muted px-4 py-3 hover:bg-muted/80 transition-colors text-left"
      >
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Code d&apos;invitation</p>
          <p className="font-mono font-bold tracking-widest text-lg">{code}</p>
        </div>
        <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      <button
        onClick={handleCopyLink}
        title="Copier le lien d'invitation"
        className="rounded-lg border bg-muted px-3 hover:bg-muted/80 transition-colors"
      >
        <Link2 className="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        onClick={handleRotate}
        disabled={isPending}
        title="Générer un nouveau code"
        className="rounded-lg border bg-muted px-3 hover:bg-muted/80 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 text-muted-foreground ${isPending ? "animate-spin" : ""}`} />
      </button>
    </div>
  )
}
