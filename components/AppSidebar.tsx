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
    <aside className="hidden md:flex w-64 flex-col border-e bg-sidebar shrink-0 h-full">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-md shadow-primary/30 shrink-0">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-bold tracking-tight flex-1">QCM Revision</span>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href))
                ? "bg-card text-foreground shadow-soft [&_svg]:text-primary"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] transition-colors" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-soft">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">{initials}</AvatarFallback>
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
