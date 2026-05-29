"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { changeUserRole } from "@/app/admin/users/actions"

const ROLES = ["student", "tutor", "admin"] as const
type Role = (typeof ROLES)[number]

const roleLabel: Record<Role, string> = {
  student: "Student",
  tutor: "Tutor",
  admin: "Admin",
}

export function ChangeRoleSelect({ userId, currentRole, isSelf = false }: { userId: string; currentRole: string; isSelf?: boolean }) {
  const [role, setRole] = useState<Role>((ROLES.includes(currentRole as Role) ? currentRole : "student") as Role)
  const [isPending, startTransition] = useTransition()

  function handleChange(newRole: Role) {
    if (newRole === role) return
    startTransition(async () => {
      const res = await changeUserRole(userId, newRole)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setRole(newRole)
      toast.success(`Rôle changé → ${roleLabel[newRole]}`)
    })
  }

  if (isSelf) {
    return (
      <span className="h-7 inline-flex items-center rounded-md border border-input bg-muted px-2 text-xs font-medium text-muted-foreground capitalize">
        {roleLabel[role]}
      </span>
    )
  }

  return (
    <select
      value={role}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="h-7 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {roleLabel[r]}
        </option>
      ))}
    </select>
  )
}
