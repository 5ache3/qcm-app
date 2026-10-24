"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, Link2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { rotateInviteCode } from "./actions"

interface Props {
  classId: string
  code: string
  baseUrl: string
}

export function ClassInviteCode({ classId, code: initialCode, baseUrl }: Props) {
  const [code, setCode] = useState(initialCode)
  const [isPending, startTransition] = useTransition()
  const link = `${baseUrl}/join/${code}`

  function handleCopy() {
    navigator.clipboard.writeText(code)
    toast.success("Code copié !")
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(link)
    toast.success("Lien d'invitation copié !")
  }

  function handleRotate() {
    if (!confirm("Générer un nouveau code ? L'ancien code et l'ancien lien ne fonctionneront plus.")) return
    startTransition(async () => {
      const res = await rotateInviteCode(classId)
      if (res?.error) { toast.error(res.error); return }
      setCode(res.code!)
      toast.success("Nouveau code généré.")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Invitation
          </CardTitle>
          <button
            onClick={handleRotate}
            disabled={isPending}
            title="Générer un nouveau code"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Nouveau code
          </button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
        <button
          onClick={handleCopy}
          className="flex items-center gap-3 rounded-lg border bg-muted px-4 py-3 hover:bg-muted/80 transition-colors text-left"
        >
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Code</p>
            <p className="font-mono font-bold tracking-widest text-lg">{code}</p>
          </div>
          <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-3 min-w-0 rounded-lg border bg-muted px-4 py-3 hover:bg-muted/80 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Lien à partager avec vos étudiants</p>
            <p className="font-mono text-sm truncate">{link}</p>
          </div>
          <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </CardContent>
    </Card>
  )
}
