import type { Metadata } from "next"
import { Inter, Fraunces, DM_Sans, Bricolage_Grotesque, IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { cookies } from "next/headers"
import { getLang, translations } from "@/lib/i18n"
import { LanguageProvider } from "@/lib/i18n-client"
import { getTheme, THEME_COOKIE } from "@/lib/theme"
import "./globals.css"

// Papier theme
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] })

// Cahier theme
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] })
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] })

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
  const theme = getTheme(cookieStore.get(THEME_COOKIE)?.value)

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-theme={theme}
      className={`${inter.variable} ${fraunces.variable} ${dmSans.variable} ${bricolage.variable} ${plexArabic.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <LanguageProvider t={t} lang={lang}>
          {children}
        </LanguageProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
