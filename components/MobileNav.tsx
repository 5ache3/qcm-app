"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookMarked,
  AlertCircle,
  UserCircle,
  Users,
  ClipboardList,
  BarChart2,
  GraduationCap,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n-client"

interface Props {
  role: string
  unreadCount: number
}

export function MobileNav({ role, unreadCount }: Props) {
  const t = useT()
  const pathname = usePathname()

  const bellItem = { href: "/notifications", label: "Alertes", icon: Bell }

  const studentNav = [
    { href: "/dashboard", label: t.nav_home, icon: LayoutDashboard },
    { href: "/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/mistakes", label: t.nav_mistakes, icon: AlertCircle },
    bellItem,
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const tutorNav = [
    { href: "/tutor", label: "Classes", icon: GraduationCap },
    bellItem,
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const adminNav = [
    { href: "/admin", label: t.nav_overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.nav_users, icon: Users },
    bellItem,
    { href: "/admin/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/admin/analytics", label: t.nav_analytics, icon: BarChart2 },
  ]

  const navItems = role === "admin" ? adminNav : role === "tutor" ? tutorNav : studentNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && href !== "/admin" && href !== "/notifications" && pathname.startsWith(href))
        const isBell = href === "/notifications"
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("relative flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary-soft")}>
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              {isBell && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
