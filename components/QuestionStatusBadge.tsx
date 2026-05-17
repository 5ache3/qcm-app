import { Badge } from "@/components/ui/badge"
import type { QuestionStatus } from "@/lib/scoring"

interface QuestionStatusBadgeProps {
  status: QuestionStatus
}

const config: Record<QuestionStatus, { label: string; variant: "success" | "warning" | "error" | "muted" }> = {
  correct:    { label: "Correct",       variant: "success" },
  partial:    { label: "Partiel",       variant: "warning" },
  wrong:      { label: "Incorrect",     variant: "error" },
  unanswered: { label: "Sans réponse",  variant: "muted" },
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
