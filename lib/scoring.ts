export function calculateQuestionScore(
  selectedOptionIds: string[],
  correctOptionIds: string[]
): number {
  const correctSet = new Set(correctOptionIds)

  const selectedWrong = selectedOptionIds.some((id) => !correctSet.has(id))
  if (selectedWrong) return 0

  const selectedCorrectCount = selectedOptionIds.filter((id) =>
    correctSet.has(id)
  ).length

  if (selectedCorrectCount === 0) return 0
  if (selectedCorrectCount === correctOptionIds.length) return 1

  return selectedCorrectCount / correctOptionIds.length
}

export function calculateTestScore(questionScores: number[]): {
  raw: number
  percentage: number
} {
  if (questionScores.length === 0) return { raw: 0, percentage: 0 }
  const raw = questionScores.reduce((sum, s) => sum + s, 0)
  const percentage = (raw / questionScores.length) * 100
  return { raw: Math.round(raw * 100) / 100, percentage: Math.round(percentage * 100) / 100 }
}

export type QuestionStatus = "correct" | "partial" | "wrong" | "unanswered"

export function getQuestionStatus(
  selectedOptionIds: string[],
  correctOptionIds: string[]
): QuestionStatus {
  if (selectedOptionIds.length === 0) return "unanswered"
  const score = calculateQuestionScore(selectedOptionIds, correctOptionIds)
  if (score === 1) return "correct"
  if (score === 0) return "wrong"
  return "partial"
}
