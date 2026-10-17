import type { Metadata } from "next"
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { cookies } from "next/headers"
import { getLang, translations } from "@/lib/i18n"
import { LanguageProvider } from "@/lib/i18n-client"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
})

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "QCM Revision",
  description: "Practice questions and take timed tests by subject",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const lang = getLang(cookieStore.get("qcm_lang")?.value)
  const t = translations[lang]

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${jakarta.variable} ${plexArabic.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <LanguageProvider t={t} lang={lang}>
          {children}
        </LanguageProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
