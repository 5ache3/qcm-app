"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, KeyRound, LogOut, Palette, Clock, GraduationCap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n-client"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import type { Theme } from "@/lib/theme"
import { updateProfile, sendPasswordReset, joinClass } from "./actions"

interface ClassMembership {
  className: string
  status: string
}

interface Props {
  email: string
  fullName: string
  role: string
  status: string
  classMemberships?: ClassMembership[]
  stats: Array<{ label: string; value: number }>
  theme: Theme
}

export function ProfileClient({ email, fullName, role, status, classMemberships = [], stats, theme }: Props) {
  const t = useT()
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [isSaving, startTransition] = useTransition()
  const [resetSent, setResetSent] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [memberships, setMemberships] = useState(classMemberships)

  function handleJoinClass() {
    if (!inviteCode.trim()) return
    startTransition(async () => {
      const res = await joinClass(inviteCode.trim())
      if (res?.error) { toast.error(res.error); return }
      toast.success(`Demande envoyée pour rejoindre "${res.className}". En attente d'approbation.`)
      setInviteCode("")
      setMemberships((prev) => [...prev, { className: res.className!, status: "pending" }])
    })
  }

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-semibold">{t.profile_title}</h1>
        <p className="text-muted-foreground mt-1">{email}</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] items-start">
        {/* Identity */}
        <Card className="lg:sticky lg:top-6">
          <CardContent className="pt-6 space-y-5">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand font-heading text-2xl font-semibold text-white">
                {(fullName || email).charAt(0).toUpperCase()}
              </div>
              <p className="mt-4 font-heading text-xl font-semibold">{fullName || email}</p>
              <Badge variant="default" className="mt-2 capitalize">{role}</Badge>
            </div>

            {stats.length > 0 && (
              <dl className="divide-y divide-dashed border-y border-dashed">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2.5 text-sm">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-semibold tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {t.sign_out}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-brand" />
                {t.profile_account}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="full_name">{t.profile_display_name}</Label>
                <Input
                  id="full_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.profile_your_name}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
              <Button disabled={isSaving || name === fullName} onClick={handleSave}>
                {isSaving ? t.profile_saving : t.profile_save}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand" />
                {t.profile_appearance}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t.profile_appearance_desc}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ThemeSwitcher current={theme} />
              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <span className="text-sm font-medium">{t.profile_language}</span>
                <div className="w-40"><LanguageSwitcher /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand" />
                {t.profile_password_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
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

          {/* Join class — students only */}
          {role === "student" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  Mes classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {memberships.length > 0 && (
                  <div className="space-y-1.5">
                    {memberships.map((m, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="font-medium">{m.className}</span>
                        {m.status === "approved" ? (
                          <Badge variant="success" className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />Approuvé
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />En attente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="invite_code">Rejoindre une classe</Label>
                  <p className="text-xs text-muted-foreground">Entrez le code fourni par votre enseignant.</p>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      id="invite_code"
                      placeholder="ex. abc12345"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                      className="font-mono"
                    />
                    <Button disabled={isSaving || !inviteCode.trim()} onClick={handleJoinClass}>
                      Rejoindre
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
