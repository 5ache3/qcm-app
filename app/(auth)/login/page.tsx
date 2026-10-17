"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BookOpen, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useT } from "@/lib/i18n-client"

type Mode = "signin" | "signup" | "forgot"

function friendlyAuthError(msg: string): string {
  if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email")) {
    return "Too many emails sent recently. Please wait a few minutes and try again."
  }
  return msg
}

export default function LoginPage() {
  const t = useT()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (error) {
        toast.error(friendlyAuthError(error.message))
      } else {
        toast.success(t.login_reset_sent_toast)
        setMode("signin")
        setEmail("")
      }
      return
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      // Only follow same-site relative paths (set by proxy for the OAuth consent flow)
      const next = new URLSearchParams(window.location.search).get("next")
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard")
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (error) {
        toast.error(friendlyAuthError(error.message))
        setLoading(false)
        return
      }
      toast.success(t.login_signup_success_toast)
      setMode("signin")
      setPassword("")
      setLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setFullName("")
    setPassword("")
    setShowPassword(false)
  }

  const titles: Record<Mode, { title: string; description: string }> = {
    signin: { title: t.login_title_signin, description: t.login_desc_signin },
    signup: { title: t.login_title_signup, description: t.login_desc_signup },
    forgot: { title: t.login_title_forgot, description: t.login_desc_forgot },
  }

  const appSubtitle =
    mode === "signin" ? t.login_app_subtitle_signin
    : mode === "signup" ? t.login_app_subtitle_signup
    : t.login_app_subtitle_forgot

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mark text-mark-foreground shadow-button">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">QCM Révision</h1>
          <p className="text-sm text-muted-foreground">{appSubtitle}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{titles[mode].title}</CardTitle>
            <CardDescription>{titles[mode].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.login_full_name}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t.login_your_name}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.login_email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t.login_password}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      className="pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signin" && (
                    <div className="text-end">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                      >
                        {t.login_forgot_link}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? mode === "signin" ? t.login_loading_signin : mode === "signup" ? t.login_loading_signup : t.login_loading_forgot
                  : mode === "signin" ? t.login_btn_signin : mode === "signup" ? t.login_btn_signup : t.login_btn_forgot}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  {t.login_no_account}{" "}
                  <button type="button" onClick={() => switchMode("signup")} className="font-medium text-foreground hover:underline">
                    {t.login_signup_link}
                  </button>
                </>
              ) : (
                <>
                  {t.login_have_account}{" "}
                  <button type="button" onClick={() => switchMode("signin")} className="font-medium text-foreground hover:underline">
                    {t.login_signin_link}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
