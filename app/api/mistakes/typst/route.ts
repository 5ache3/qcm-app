import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnswerOption = {
  id: string
  option_text: string
  is_correct: boolean
  position: number
}

type MistakeItem = {
  question_id: string
  status: "wrong" | "partial"
  selected_option_ids: string[]
  question_text: string
  explanation: string | null
  answer_options: AnswerOption[]
}

type RawPracticeAnswer = {
  question_id: string
  selected_option_ids: string[]
  status: string
  questions: {
    question_text: string
    explanation: string | null
    answer_options: AnswerOption[]
  }
}

type RawTestAnswer = {
  question_id: string
  test_id: string
  selected_option_ids: string[]
  status: string
  questions: {
    question_text: string
    explanation: string | null
    answer_options: AnswerOption[]
  }
}

type TestMeta = {
  id: string
  test_number: number | null
  started_at: string
}

// ---------------------------------------------------------------------------
// Supabase clients
// ---------------------------------------------------------------------------

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ---------------------------------------------------------------------------
// Typst text escaping (content mode)
// ---------------------------------------------------------------------------

function esc(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/#/g, "\\#")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/@/g, "\\@")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/~/g, "\\~")
    .replace(/\n/g, " ")
}

// ---------------------------------------------------------------------------
// Typst codegen — all helpers return code-mode expressions (no leading #)
// ---------------------------------------------------------------------------

function optColors(isCorrect: boolean, isSelected: boolean) {
  if (isCorrect && isSelected)  return { bg: "#dcfce7", border: "#22c55e", text: "#166534", dot: "#16a34a" }
  if (isCorrect && !isSelected) return { bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#4ade80" }
  if (!isCorrect && isSelected) return { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", dot: "#dc2626" }
  return                                { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8", dot: "#cbd5e1" }
}

function optBlock(opt: AnswerOption, isSelected: boolean): string {
  const c = optColors(opt.is_correct, isSelected)
  return (
    `block(fill: rgb("${c.bg}"), radius: 5pt, stroke: 1pt + rgb("${c.border}"), inset: (x: 6pt, y: 5pt), width: 100%)[` +
      `#grid(columns: (auto, 1fr), column-gutter: 5pt, align: (top, top),` +
        `circle(fill: rgb("${c.dot}"), radius: 3pt),` +
        `[#text(size: 7.5pt, fill: rgb("${c.text}"))[${esc(opt.option_text)}]]` +
      `)` +
    `]`
  )
}

function cardBlock(item: MistakeItem, num: number): string {
  const sorted = [...item.answer_options].sort((a, b) => a.position - b.position)
  const badgeBg    = item.status === "wrong" ? "#fee2e2" : "#fef3c7"
  const badgeColor = item.status === "wrong" ? "#991b1b" : "#b45309"
  const badgeLabel = item.status === "wrong" ? "Incorrect" : "Partiel"

  const optRows: string[] = []
  for (let i = 0; i < sorted.length; i += 2) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const aExpr = optBlock(a, item.selected_option_ids.includes(a.id))
    const bExpr = b ? optBlock(b, item.selected_option_ids.includes(b.id)) : "[]"
    optRows.push(
      `#grid(columns: (1fr, 1fr), column-gutter: 3pt,\n      ${aExpr},\n      ${bExpr}\n    )`
    )
  }

  const expBlock = item.explanation
    ? `\n    #block(fill: rgb("#eff6ff"), radius: 5pt, stroke: 1pt + rgb("#bfdbfe"), inset: 7pt, width: 100%, above: 6pt)[` +
        `#text(size: 7.5pt, weight: "bold", fill: rgb("#1d4ed8"))[Explication]` +
        `#v(2pt)` +
        `#text(size: 7.5pt, fill: rgb("#2563eb"))[${esc(item.explanation)}]` +
      `]`
    : ""

  return (
    `block(fill: white, radius: 8pt, stroke: 1pt + rgb("#e2e8f0"), inset: 10pt, width: 100%, breakable: false)[` +
      `#text(size: 7.5pt, weight: "bold", fill: rgb("#64748b"))[Q.${num}]` +
      `#v(3pt)` +
      `#grid(columns: (1fr, auto), align: (left + horizon, right + horizon),` +
        `[#text(size: 9pt, weight: "bold")[${esc(item.question_text)}]],` +
        `[#block(fill: rgb("${badgeBg}"), radius: 4pt, inset: (x: 5pt, y: 2pt))[` +
          `#text(size: 7pt, weight: "bold", fill: rgb("${badgeColor}"))[${badgeLabel}]` +
        `]]` +
      `)` +
      `#v(4pt)` +
      optRows.join("\n    #v(3pt)\n    ") +
      expBlock +
    `]`
  )
}

function generateTypst(
  subjectName: string,
  mistakes: MistakeItem[],
  exportDate: string,
  isTest: boolean,
): string {
  const title = `${subjectName} — ${isTest ? "Erreurs (Tests)" : "Erreurs (Entraînement)"}`
  const count  = mistakes.length
  const noun   = count > 1 ? "questions à revoir" : "question à revoir"
  const gridCells = mistakes.map((item, i) => cardBlock(item, i + 1)).join(",\n  ")

  return `\
// Generated by QCM — ${exportDate}
#set page(
  paper: "a4",
  fill: rgb("#f1f5f9"),
  margin: (x: 24pt, top: 24pt, bottom: 40pt),
  numbering: "1 / 1",
  number-align: right + bottom,
)
#set text(font: ("Helvetica", "Arial", "Liberation Sans"), size: 9pt, fill: rgb("#0f172a"))
#set par(leading: 0.65em)

// ── Header ──────────────────────────────────────────────────────────────────
#block(fill: rgb("#0f172a"), radius: 8pt, inset: (x: 20pt, y: 16pt), width: 100%, below: 16pt)[
  #grid(columns: (1fr, auto), align: (left + horizon, right + horizon),
    [
      #text(size: 16pt, weight: "bold", fill: rgb("#f8fafc"))[${esc(title)}]
      #v(3pt)
      #text(size: 9pt, fill: rgb("#94a3b8"))[${count} ${noun}]
    ],
    [#text(size: 8.5pt, fill: rgb("#94a3b8"))[${exportDate}]]
  )
]

// ── Questions (2-column grid) ────────────────────────────────────────────────
#grid(columns: (1fr, 1fr), gutter: 8pt,
  ${gridCells}
)
`
}

// ---------------------------------------------------------------------------
// Data fetchers (use service client — no RLS restrictions)
// ---------------------------------------------------------------------------

async function fetchPracticeMistakes(
  db: ReturnType<typeof serviceClient>,
  personId: string,
  subjectId: string,
): Promise<MistakeItem[]> {
  const { data } = await db
    .from("practice_answers")
    .select(`
      question_id,
      selected_option_ids,
      status,
      questions (
        question_text,
        explanation,
        answer_options ( id, option_text, is_correct, position )
      )
    `)
    .eq("user_id", personId)
    .eq("subject_id", subjectId)
    .in("status", ["wrong", "partial"])
    .order("answered_at", { ascending: false })

  return ((data ?? []) as unknown as RawPracticeAnswer[]).map((ans) => ({
    question_id: ans.question_id,
    status: ans.status as "wrong" | "partial",
    selected_option_ids: ans.selected_option_ids,
    question_text: ans.questions.question_text,
    explanation: ans.questions.explanation,
    answer_options: ans.questions.answer_options ?? [],
  }))
}

async function fetchTestMistakes(
  db: ReturnType<typeof serviceClient>,
  personId: string,
  subjectId: string,
): Promise<MistakeItem[]> {
  const { data: userTests } = await db
    .from("tests")
    .select("id, test_number, started_at")
    .eq("user_id", personId)
    .eq("subject_id", subjectId)
    .in("status", ["completed", "expired"])
    .order("started_at", { ascending: false })

  const tests = (userTests ?? []) as TestMeta[]
  const testIds = tests.map((t) => t.id)
  if (testIds.length === 0) return []

  const { data } = await db
    .from("test_answers")
    .select(`
      question_id,
      test_id,
      selected_option_ids,
      status,
      questions (
        question_text,
        explanation,
        answer_options ( id, option_text, is_correct, position )
      )
    `)
    .in("test_id", testIds)
    .in("status", ["wrong", "partial"])

  const rawAnswers = ((data ?? []) as unknown as RawTestAnswer[])

  const testOrder = new Map<string, number>(tests.map((t, idx) => [t.id, idx]))
  const best = new Map<string, RawTestAnswer>()
  for (const ans of rawAnswers) {
    const order = testOrder.get(ans.test_id) ?? Infinity
    const existing = best.get(ans.question_id)
    const existingOrder = existing ? (testOrder.get(existing.test_id) ?? Infinity) : Infinity
    if (order < existingOrder) best.set(ans.question_id, ans)
  }

  return Array.from(best.values())
    .sort((a, b) => (testOrder.get(a.test_id) ?? 0) - (testOrder.get(b.test_id) ?? 0))
    .map((ans) => ({
      question_id: ans.question_id,
      status: ans.status as "wrong" | "partial",
      selected_option_ids: ans.selected_option_ids,
      question_text: ans.questions.question_text,
      explanation: ans.questions.explanation,
      answer_options: ans.questions.answer_options ?? [],
    }))
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(request: NextRequest) {
  // ── 1. Body ──────────────────────────────────────────────────────────────
  let body: { subjectId?: string; personId?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { subjectId, personId, type = "practice" } = body

  if (!subjectId) return json({ error: "subjectId is required" }, 400)
  if (!personId)  return json({ error: "personId is required" }, 400)
  if (type !== "practice" && type !== "test")
    return json({ error: "type must be 'practice' or 'test'" }, 400)

  // ── 3. Data ──────────────────────────────────────────────────────────────
  const db = serviceClient()

  const { data: subject, error: subjectError } = await db
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .single()

  if (!subject) return json({ error: "Subject not found", detail: subjectError?.message }, 422)

  const mistakes =
    type === "practice"
      ? await fetchPracticeMistakes(db, personId, subjectId)
      : await fetchTestMistakes(db, personId, subjectId)

  // ── 4. Generate Typst ────────────────────────────────────────────────────
  const exportDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const typst = generateTypst(subject.name, mistakes, exportDate, type === "test")

  return new Response(typst, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
