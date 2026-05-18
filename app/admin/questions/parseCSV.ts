export interface ParsedOption {
  option_text: string
  is_correct: boolean
  position: number
}

export interface ParsedQuestion {
  question_text: string
  explanation: string | null
  difficulty: string | null
  lesson: string | null
  options: ParsedOption[]
}

function parseCorrect(val: string): boolean {
  return ["true", "1", "yes", "oui", "correct", "x"].includes(val.toLowerCase().trim())
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export function parseCSV(csvText: string): { questions: ParsedQuestion[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) {
    return { questions: [], errors: ["CSV must have a header row and at least one data row"] }
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""))
  const errors: string[] = []
  const questions: ParsedQuestion[] = []

  const qIdx = headers.indexOf("question_text")
  const explIdx = headers.indexOf("explanation")
  const diffIdx = headers.indexOf("difficulty")

  if (qIdx === -1) return { questions: [], errors: ["Missing required column: question_text"] }

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim()) continue

    const cells = parseCSVLine(raw)
    const question_text = cells[qIdx]?.replace(/^"|"$/g, "").trim()
    if (!question_text) {
      errors.push(`Row ${i + 1}: empty question_text, skipped`)
      continue
    }

    const explanation = explIdx !== -1 ? cells[explIdx]?.replace(/^"|"$/g, "").trim() || null : null
    const rawDiff = diffIdx !== -1 ? cells[diffIdx]?.replace(/^"|"$/g, "").trim().toLowerCase() : null
    const difficulty = ["easy", "medium", "hard"].includes(rawDiff ?? "") ? rawDiff : null

    const options: ParsedOption[] = []
    let n = 1
    while (true) {
      const optIdx = headers.indexOf(`option_${n}`)
      const corIdx = headers.indexOf(`correct_${n}`)
      if (optIdx === -1) break
      const optText = cells[optIdx]?.replace(/^"|"$/g, "").trim()
      if (!optText) { n++; continue }
      const isCorrect = corIdx !== -1 ? parseCorrect(cells[corIdx] ?? "") : false
      options.push({ option_text: optText, is_correct: isCorrect, position: n - 1 })
      n++
    }

    if (options.length < 2) {
      errors.push(`Row ${i + 1}: "${question_text.slice(0, 40)}" needs at least 2 options, skipped`)
      continue
    }
    if (!options.some((o) => o.is_correct)) {
      errors.push(`Row ${i + 1}: "${question_text.slice(0, 40)}" has no correct option marked`)
    }

    questions.push({ question_text, explanation, difficulty, lesson: null, options })
  }

  return { questions, errors }
}
