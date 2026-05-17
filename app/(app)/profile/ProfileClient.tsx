"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, KeyRound, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { updateProfile, sendPasswordReset } from "./actions"

interface Props {
  email: string
  fullName: string
  role: string
}

export function ProfileClient({ email, fullName, role }: Props) {
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [isPending, startTransition] = useTransition()
  const [resetSent, setResetSent] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Déconnecté")
    router.push("/login")
    router.refresh()
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Le nom ne peut pas être vide"); return }
    startTransition(async () => {
      const res = await updateProfile({ full_name: name.trim() })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Profil mis à jour")
    })
  }

  function handlePasswordReset() {
    startTransition(async () => {
      const res = await sendPasswordReset()
      if (res?.error) { toast.error(res.error); return }
      setResetSent(true)
      toast.success("E-mail de réinitialisation envoyé")
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{email}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Détails du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nom d&apos;affichage</Label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>Rôle</Label>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
              {role}
            </Badge>
          </div>
          <Button disabled={isPending || name === fullName} onClick={handleSave}>
            {isPending ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Nous enverrons un lien de réinitialisation à <span className="font-medium text-foreground">{email}</span>.
          </p>
          <Button
            variant="outline"
            disabled={isPending || resetSent}
            onClick={handlePasswordReset}
          >
            {resetSent ? "E-mail envoyé" : "Envoyer l'e-mail de réinitialisation"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  )
}
