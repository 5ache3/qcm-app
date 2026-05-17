"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { approveUser } from "@/app/admin/users/actions"
import { useT } from "@/lib/i18n-client"

export function ApproveUserButton({ userId }: { userId: string }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    setLoading(true)
    const result = await approveUser(userId)
    if (result.success) {
      setDone(true)
    } else {
      toast.error(t.error_generic)
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle className="h-3.5 w-3.5" />
        {t.admin_approve_btn}
      </span>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleApprove}
      disabled={loading}
      className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
    >
      <CheckCircle className="h-3.5 w-3.5 me-1.5" />
      {loading ? "…" : t.admin_approve_btn}
    </Button>
  )
}
