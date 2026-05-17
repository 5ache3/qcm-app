import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { cookies } from "next/headers"
import { getLang, translations } from "@/lib/i18n"
import { LanguageProvider } from "@/lib/i18n-client"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <LanguageProvider t={t} lang={lang}>
          {children}
        </LanguageProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
