"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { KeyRound, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createMcpToken, revokeMcpToken } from "./actions"

interface McpTokenRow {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
}

interface Props {
  tokens: McpTokenRow[]
  mcpUrl: string
}

export function McpTokensCard({ tokens, mcpUrl }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [newToken, setNewToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const res = await createMcpToken(name)
      if (res.error) { toast.error(res.error); return }
      setNewToken(res.token!)
      setName("")
      router.refresh()
    })
  }

  function handleRevoke(tokenId: string, tokenName: string) {
    if (!confirm(`Révoquer le jeton "${tokenName}" ? Les clients qui l'utilisent perdront l'accès.`)) return
    startTransition(async () => {
      const res = await revokeMcpToken(tokenId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Jeton révoqué")
      router.refresh()
    })
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copié !")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Accès MCP
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Connectez un assistant IA (Claude Code, Cursor…) pour créer des classes, des matières et des questions.
          URL du serveur : <span className="font-mono">{mcpUrl}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {newToken && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-3 space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Copiez ce jeton maintenant, il ne sera plus affiché.
            </p>
            <button
              onClick={() => copy(newToken)}
              className="flex items-center gap-2 w-full rounded-md bg-muted px-3 py-2 text-xs font-mono hover:bg-muted/80 transition-colors text-start"
            >
              <span className="truncate">{newToken}</span>
              <Copy className="h-3 w-3 ms-auto shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du jeton, ex. Claude Code"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
            Générer
          </Button>
        </div>

        {tokens.length > 0 && (
          <div className="space-y-1">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Créé le {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    {" · "}
                    {t.last_used_at
                      ? `utilisé le ${new Date(t.last_used_at).toLocaleDateString("fr-FR")}`
                      : "jamais utilisé"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  disabled={isPending}
                  onClick={() => handleRevoke(t.id, t.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
