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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n-client"

interface Props {
  role: string
}

export function MobileNav({ role }: Props) {
  const t = useT()
  const pathname = usePathname()

  const studentNav = [
    { href: "/dashboard", label: t.nav_home, icon: LayoutDashboard },
    { href: "/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/mistakes", label: t.nav_mistakes, icon: AlertCircle },
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const tutorNav = [
    { href: "/tutor", label: "Classes", icon: GraduationCap },
    { href: "/profile", label: t.nav_profile, icon: UserCircle },
  ]

  const adminNav = [
    { href: "/admin", label: t.nav_overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.nav_users, icon: Users },
    { href: "/admin/subjects", label: t.nav_subjects, icon: BookMarked },
    { href: "/admin/questions", label: t.nav_questions, icon: ClipboardList },
    { href: "/admin/analytics", label: t.nav_analytics, icon: BarChart2 },
  ]

  const navItems = role === "admin" ? adminNav : role === "tutor" ? tutorNav : studentNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
