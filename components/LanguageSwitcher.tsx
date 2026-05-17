"use client"

import { useRouter } from "next/navigation"
import { useLang } from "@/lib/i18n-client"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const router = useRouter()
  const lang = useLang()

  function switchLang() {
    const next = lang === "fr" ? "ar" : "fr"
    document.cookie = `qcm_lang=${next}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLang}
      className="w-full justify-start text-muted-foreground font-medium text-sm"
    >
      {lang === "fr" ? "🇲🇦 عربي" : "🇫🇷 Français"}
    </Button>
  )
}
