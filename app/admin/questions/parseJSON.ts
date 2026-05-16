import type { ParsedQuestion, ParsedOption } from "./parseCSV"

// Expected JSON format — array of question objects:
// [
//   {
//     "question_text": "...",
//     "explanation": "...",      // optional
//     "difficulty": "easy",      // optional: easy | medium | hard
//     "options": [
//       { "text": "...", "correct": true },
//       { "text": "...", "correct": false }
//     ]
//   }
// ]

export function parseJSON(jsonText: string): { questions: ParsedQuestion[]; errors: string[] } {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch {
    return { questions: [], errors: ["Invalid JSON — could not parse file"] }
  }

  if (!Array.isArray(raw)) {
    return { questions: [], errors: ["JSON must be an array of question objects"] }
  }

  const errors: string[] = []
  const questions: ParsedQuestion[] = []

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>
    const label = `Item ${i + 1}`

    if (typeof item !== "object" || item === null) {
      errors.push(`${label}: not an object, skipped`)
      continue
    }

    const question_text = (item.question_text ?? item.question ?? item.text ?? "") as string
    if (!question_text.trim()) {
      errors.push(`${label}: missing question_text, skipped`)
      continue
    }

    const explanation =
      typeof item.explanation === "string" && item.explanation.trim()
        ? item.explanation.trim()
        : null

    const rawDiff = typeof item.difficulty === "string" ? item.difficulty.toLowerCase().trim() : ""
    const difficulty = ["easy", "medium", "hard"].includes(rawDiff) ? rawDiff : null

    const rawOptions = item.options ?? item.answers ?? item.choices
    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      errors.push(`${label}: "${question_text.slice(0, 40)}" — missing options array, skipped`)
      continue
    }

    const options: ParsedOption[] = []
    for (let j = 0; j < rawOptions.length; j++) {
      const opt = rawOptions[j] as Record<string, unknown>
      if (typeof opt !== "object" || opt === null) continue

      const optText = (opt.text ?? opt.option_text ?? opt.label ?? opt.value ?? "") as string
      if (!optText.toString().trim()) continue

      const isCorrect =
        opt.correct === true ||
        opt.is_correct === true ||
        opt.correct === 1 ||
        String(opt.correct).toLowerCase() === "true"

      options.push({ option_text: optText.toString().trim(), is_correct: isCorrect, position: j })
    }

    if (options.length < 2) {
      errors.push(`${label}: "${question_text.slice(0, 40)}" needs at least 2 options, skipped`)
      continue
    }
    if (!options.some((o) => o.is_correct)) {
      errors.push(`${label}: "${question_text.slice(0, 40)}" has no correct option marked`)
    }

    questions.push({ question_text: question_text.trim(), explanation, difficulty, options })
  }

  return { questions, errors }
}
