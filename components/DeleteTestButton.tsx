"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteTest } from "@/app/(app)/subjects/[subjectId]/test/actions"
import { useT } from "@/lib/i18n-client"

interface Props {
  testId: string
  redirectTo?: string
  iconOnly?: boolean
  size?: "default" | "sm"
}

export function DeleteTestButton({ testId, redirectTo, iconOnly = false, size = "sm" }: Props) {
  const t = useT()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteTest(testId)
    if (result.success) {
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } else {
      toast.error(t.error_generic)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading} className="h-7 px-2 text-xs">
          {loading ? "…" : t.admin_delete_confirm}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading} className="h-7 px-2 text-xs">
          {t.admin_cancel}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => setConfirming(true)}
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className={`h-4 w-4 ${iconOnly ? "" : "me-1.5"}`} />
      {!iconOnly && t.admin_delete_confirm}
    </Button>
  )
}
