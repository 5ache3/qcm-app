import { Badge } from "@/components/ui/badge"
import type { QuestionStatus } from "@/lib/scoring"

interface QuestionStatusBadgeProps {
  status: QuestionStatus
}

const config: Record<QuestionStatus, { label: string; variant: "success" | "warning" | "error" | "muted" }> = {
  correct:    { label: "Correct",    variant: "success" },
  partial:    { label: "Partial",    variant: "warning" },
  wrong:      { label: "Wrong",      variant: "error" },
  unanswered: { label: "Unanswered", variant: "muted" },
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
