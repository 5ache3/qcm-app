"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { retakeTest } from "@/app/(app)/subjects/[subjectId]/test/actions"
import { useT } from "@/lib/i18n-client"

interface Props {
  testId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm"
  iconOnly?: boolean
}

export function RetakeButton({ testId, variant = "outline", size = "sm", iconOnly = false }: Props) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetake() {
    setLoading(true)
    try {
      const { subjectId, lessonId } = await retakeTest(testId)
      const path = lessonId
        ? `/subjects/${subjectId}/lessons/${lessonId}/test`
        : `/subjects/${subjectId}/test`
      router.push(path)
    } catch {
      toast.error(t.error_generic)
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleRetake} disabled={loading}>
      <RotateCcw className={`h-4 w-4 ${iconOnly ? "" : "me-1.5"} ${loading ? "animate-spin" : ""}`} />
      {!iconOnly && (loading ? "…" : t.review_retake)}
    </Button>
  )
}
