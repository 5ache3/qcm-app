"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { THEME_COOKIE, type Theme } from "@/lib/theme"

const THEMES: { id: Theme; name: string; description: string; swatches: string[]; preview: string }[] = [
  {
    id: "paper",
    name: "Papier & encre",
    description: "Calme, titres en serif",
    swatches: ["#faf8f3", "#1c1b19", "#1f5c45", "#e3d3bd"],
    preview: "bg-[#faf8f3] text-[#1c1b19] border border-[#e7e2d6] font-[family-name:var(--font-fraunces)]",
  },
  {
    id: "cahier",
    name: "Cahier",
    description: "Chaleureux, contours marqués",
    swatches: ["#f6efe4", "#2b2118", "#e2572b", "#ffd66b"],
    preview: "bg-[#f6efe4] text-[#2b2118] border-2 border-[#2b2118] shadow-[3px_3px_0_#2b2118] font-[family-name:var(--font-bricolage)]",
  },
]

// Save the choice and apply it right away; the server reads the cookie on the next request
function applyTheme(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`
  document.documentElement.setAttribute("data-theme", theme)
}

export function ThemeSwitcher({ current }: { current: Theme }) {
  const [theme, setTheme] = useState(current)

  function choose(next: Theme) {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => choose(t.id)}
          aria-pressed={theme === t.id}
          className={cn(
            "relative rounded-xl border p-3 text-start transition-all",
            theme === t.id ? "border-brand ring-2 ring-brand/30" : "hover:border-muted-foreground/40"
          )}
        >
          <div className={cn("rounded-lg px-3 py-3", t.preview)}>
            <p className="text-lg font-semibold leading-none">Aa</p>
            <div className="mt-3 flex gap-1.5">
              {t.swatches.map((c) => (
                <span key={c} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
              ))}
            </div>
          </div>
          <p className="mt-2.5 text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.description}</p>
          {theme === t.id && (
            <span className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
