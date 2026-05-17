"use client"

import { createContext, useContext } from "react"
import type { Dict, Lang } from "./i18n"

interface I18nContextValue {
  t: Dict
  lang: Lang
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface LanguageProviderProps {
  t: Dict
  lang: Lang
  children: React.ReactNode
}

export function LanguageProvider({ t, lang, children }: LanguageProviderProps) {
  return (
    <I18nContext.Provider value={{ t, lang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT(): Dict {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useT must be used inside LanguageProvider")
  return ctx.t
}

export function useLang(): Lang {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider")
  return ctx.lang
}
