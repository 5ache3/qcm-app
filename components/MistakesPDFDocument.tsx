import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

export type AnswerOption = {
  id: string
  option_text: string
  is_correct: boolean
  position: number
}

export type MistakeItem = {
  question_id: string
  status: "wrong" | "partial"
  selected_option_ids: string[]
  question_text: string
  explanation: string | null
  answer_options: AnswerOption[]
}

const C = {
  pageBg: "#f1f5f9",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  headerBg: "#0f172a",
  headerText: "#f8fafc",
  headerMuted: "#94a3b8",
  // option states
  cs: { bg: "#dcfce7", border: "#22c55e", text: "#166534", dot: "#16a34a" },   // correct + selected
  cm: { bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#4ade80" },   // correct + missed
  ws: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", dot: "#dc2626" },   // wrong + selected
  neu: { bg: "#f8fafc", border: "#e2e8f0", text: "#94a3b8", dot: "#cbd5e1" },  // neutral
  // status badges
  bWrong: { bg: "#fee2e2", text: "#991b1b" },
  bPartial: { bg: "#fef3c7", text: "#b45309" },
  // explanation
  expBg: "#eff6ff",
  expBorder: "#bfdbfe",
  expTitle: "#1d4ed8",
  expText: "#2563eb",
}

const s = StyleSheet.create({
  page: {
    backgroundColor: C.pageBg,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: C.headerBg,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: C.headerText,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  headerSub: { color: C.headerMuted, fontSize: 9 },
  headerDate: { color: C.headerMuted, fontSize: 8.5 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  colL: { flex: 1, marginRight: 4 },
  colR: { flex: 1, marginLeft: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },
  qNum: {
    color: C.muted,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  qText: {
    flex: 1,
    color: C.text,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.5,
    marginRight: 6,
  },
  badge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  optRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  opt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  optText: { flex: 1, fontSize: 7.5, lineHeight: 1.35 },
  exp: {
    backgroundColor: C.expBg,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.expBorder,
    padding: 7,
    marginTop: 6,
  },
  expTitle: {
    color: C.expTitle,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  expText: { color: C.expText, fontSize: 7.5, lineHeight: 1.35 },
  pageNum: {
    position: "absolute",
    bottom: 14,
    right: 24,
    color: C.headerMuted,
    fontSize: 7.5,
  },
})

function optColors(isCorrect: boolean, isSelected: boolean) {
  if (isCorrect && isSelected) return C.cs
  if (isCorrect) return C.cm
  if (isSelected) return C.ws
  return C.neu
}

function QuestionCard({ item, num }: { item: MistakeItem; num: number }) {
  const sorted = [...item.answer_options].sort((a, b) => a.position - b.position)
  const pairs: typeof sorted[] = []
  for (let i = 0; i < sorted.length; i += 2) pairs.push(sorted.slice(i, i + 2))

  const badge = item.status === "wrong" ? C.bWrong : C.bPartial
  const label = item.status === "wrong" ? "Incorrect" : "Partiel"

  return (
    <View style={s.card}>
      <Text style={s.qNum}>Q.{num}</Text>
      <View style={s.cardTop}>
        <Text style={s.qText}>{item.question_text}</Text>
        <View style={[s.badge, { backgroundColor: badge.bg }]}>
          <Text style={[s.badgeText, { color: badge.text }]}>{label}</Text>
        </View>
      </View>

      {pairs.map((pair, pi) => (
        <View key={pi} style={s.optRow}>
          {pair.map((opt, oi) => {
            const sel = item.selected_option_ids.includes(opt.id)
            const c = optColors(opt.is_correct, sel)
            return (
              <View
                key={opt.id}
                style={[
                  s.opt,
                  { backgroundColor: c.bg, borderColor: c.border },
                  oi === 0 && pair.length > 1 ? { marginRight: 3 } : {},
                ]}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: c.dot,
                    marginRight: 5,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <Text style={[s.optText, { color: c.text }]}>{opt.option_text}</Text>
              </View>
            )
          })}
          {pair.length === 1 && <View style={{ flex: 1, marginLeft: 3 }} />}
        </View>
      ))}

      {item.explanation && (
        <View style={s.exp}>
          <Text style={s.expTitle}>Explication</Text>
          <Text style={s.expText}>{item.explanation}</Text>
        </View>
      )}
    </View>
  )
}

export function MistakesPDFDocument({
  subjectName,
  mistakes,
  exportDate,
}: {
  subjectName: string
  mistakes: MistakeItem[]
  exportDate: string
}) {
  const pairs: [MistakeItem, MistakeItem | null][] = []
  for (let i = 0; i < mistakes.length; i += 2) {
    pairs.push([mistakes[i], mistakes[i + 1] ?? null])
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>{subjectName} — Erreurs</Text>
            <Text style={s.headerSub}>
              {mistakes.length} question{mistakes.length > 1 ? "s" : ""} à revoir
            </Text>
          </View>
          <Text style={s.headerDate}>{exportDate}</Text>
        </View>

        {pairs.map(([a, b], i) => (
          <View key={i} style={s.row}>
            <View style={s.colL}>
              <QuestionCard item={a} num={i * 2 + 1} />
            </View>
            <View style={s.colR}>
              {b ? <QuestionCard item={b} num={i * 2 + 2} /> : null}
            </View>
          </View>
        ))}

        <Text
          style={s.pageNum}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
