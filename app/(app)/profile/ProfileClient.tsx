"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, KeyRound, LogOut, Languages, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n-client"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { updateProfile, sendPasswordReset } from "./actions"

interface Props {
  email: string
  fullName: string
  role: string
  status: string
}

export function ProfileClient({ email, fullName, role, status }: Props) {
  const t = useT()
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [isSaving, startTransition] = useTransition()
  const [resetSent, setResetSent] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t.signed_out_toast)
    router.push("/login")
    router.refresh()
  }

  function handleSave() {
    if (!name.trim()) { toast.error(t.profile_name_empty_toast); return }
    startTransition(async () => {
      const res = await updateProfile({ full_name: name.trim() })
      if (res?.error) { toast.error(res.error); return }
      toast.success(t.profile_saved_toast)
    })
  }

  function handlePasswordReset() {
    startTransition(async () => {
      const res = await sendPasswordReset()
      if (res?.error) { toast.error(res.error); return }
      setResetSent(true)
      toast.success(t.profile_reset_sent_toast)
    })
  }

  const isPendingApproval = status === "pending"

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">{t.profile_title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{email}</p>
      </div>

      {isPendingApproval && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-5 pb-5 flex gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                {t.pending_title}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {t.pending_desc}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t.profile_account}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">{t.profile_display_name}</Label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.profile_your_name}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>{t.profile_role}</Label>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
              {role}
            </Badge>
          </div>
          <Button disabled={isSaving || name === fullName} onClick={handleSave}>
            {isSaving ? t.profile_saving : t.profile_save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {t.profile_password_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t.profile_password_desc} <span className="font-medium text-foreground">{email}</span>.
          </p>
          <Button
            variant="outline"
            disabled={isSaving || resetSent}
            onClick={handlePasswordReset}
          >
            {resetSent ? t.profile_reset_sent : t.profile_send_reset}
          </Button>
        </CardContent>
      </Card>

      {/* Language switcher — visible on mobile where sidebar is hidden */}
      <Card className="md:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Langue / اللغة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Separator />

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 me-2" />
        {t.sign_out}
      </Button>
    </div>
  )
}
