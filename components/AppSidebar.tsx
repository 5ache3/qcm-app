"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  LayoutDashboard,
  BookMarked,
  ClipboardList,
  AlertCircle,
  Users,
  BarChart2,
  LogOut,
  UserCircle,
  GraduationCap,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useT } from "@/lib/i18n-client"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { NotificationBell } from "@/components/NotificationBell"
import type { User } from "@supabase/supabase-js"

interface Profile {
  full_name: string | null
  role: string | null
}

interface AppSidebarProps {
  user: User
  profile: Profile | null
  unreadCount: number
}

export function AppSidebar({ user, profile, unreadCount }: AppSidebarProps) {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile?.role === "admin"
  const isTutor = profile?.role === "tutor"

  const studentNav = [
    { href: "/dashboard", label: t.nav_dashboard, icon: LayoutDashboard },
    { href: "/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/mistakes", label: t.nav_mistakes, icon: AlertCircle },
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const tutorNav = [
    { href: "/tutor", label: "Mes classes", icon: GraduationCap },
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const adminNav = [
    { href: "/admin", label: t.nav_overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.nav_users, icon: Users },
    { href: "/admin/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/admin/questions", label: t.nav_questions, icon: ClipboardList },
    { href: "/admin/analytics", label: t.nav_analytics, icon: BarChart2 },
  ]

  const navItems = isAdmin ? adminNav : isTutor ? tutorNav : studentNav
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? user.email?.[0].toUpperCase() ?? "U"

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t.signed_out_toast)
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-semibold text-sm flex-1">QCM Revision</span>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href))
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profile?.full_name ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? "student"}</p>
          </div>
        </div>
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {t.sign_out}
        </Button>
      </div>
    </aside>
  )
}
