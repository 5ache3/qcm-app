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
} from "lucide-react"
import { cn } from "@/lib/utils"

const studentNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookMarked },
  { href: "/mistakes", label: "Mistakes", icon: AlertCircle },
  { href: "/profile", label: "Profile", icon: UserCircle },
]

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subjects", label: "Subjects", icon: BookMarked },
  { href: "/admin/questions", label: "Questions", icon: ClipboardList },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
]

interface Props {
  isAdmin: boolean
}

export function MobileNav({ isAdmin }: Props) {
  const pathname = usePathname()
  const navItems = isAdmin ? adminNav : studentNav

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
