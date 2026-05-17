"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Timer, ArrowLeft, ArrowRight, Flag, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { calculateQuestionScore, getQuestionStatus } from "@/lib/scoring"
import type { QuestionStatus } from "@/lib/scoring"
import { shuffleArray } from "@/lib/utils"
import { useT } from "@/lib/i18n-client"
import { startTest, submitTest } from "./actions"

interface AnswerOption {
  id: string
  option_text: string
  is_correct: boolean
  position: number
}

interface Question {
  id: string
  question_text: string
  explanation: string | null
  difficulty: string | null
  answer_options: AnswerOption[]
}

interface TestData {
  testId: string
  startedAt: string
  questions: Question[]
  durationSeconds: number
}

type Phase = "start" | "active" | "submitting"

interface QuestionResult {
  score: number
  status: QuestionStatus
}

interface Props {
  subject: { id: string; name: string; icon: string | null }
  questionCount: number
  userId: string
}

export function TestClient({ subject, questionCount, userId }: Props) {
  const t = useT()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("start")
  const [testData, setTestData] = useState<TestData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [results, setResults] = useState<Record<string, QuestionResult>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback(
    (expired: boolean) => {
      if (!testData || phase === "submitting") return
      setPhase("submitting")

      const elapsed = testData.durationSeconds - secondsLeft
      const answerList = testData.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] ?? [],
      }))

      startTransition(async () => {
        try {
          const result = await submitTest(testData.testId, answerList, elapsed, expired)
          if (expired) toast.info(t.test_time_up_toast)
          router.push(`/tests/${result.testId}/review`)
        } catch {
          toast.error(t.test_submit_fail_toast)
          setPhase("active")
        }
      })
    },
    [testData, phase, secondsLeft, answers, router, startTransition, t]
  )

  // Timer tick
  useEffect(() => {
    if (phase !== "active" || !testData) return

    // Calculate remaining time from startedAt
    const elapsed = Math.floor(
      (Date.now() - new Date(testData.startedAt).getTime()) / 1000
    )
    const remaining = Math.max(0, testData.durationSeconds - elapsed)
    setSecondsLeft(remaining)

    if (remaining <= 0) {
      handleSubmit(true)
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, testData]) // eslint-disable-line react-hooks/exhaustive-deps

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  function handleStart() {
    startTransition(async () => {
      try {
        const data = await startTest(subject.id)
        setTestData({
          ...data,
          questions: data.questions.map((q) => ({
            ...q,
            answer_options: shuffleArray(q.answer_options),
          })),
        })
        setPhase("active")
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : null
        toast.error(msg ?? t.error_generic)
      }
    })
  }

  function toggleOption(questionId: string, optionId: string) {
    if (results[questionId]) return // locked after confirm
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
  }

  function confirmAnswer(question: Question) {
    if (results[question.id]) return
    const selected = answers[question.id] ?? []
    const correctIds = question.answer_options.filter((o) => o.is_correct).map((o) => o.id)
    const score = calculateQuestionScore(selected, correctIds)
    const status = getQuestionStatus(selected, correctIds)
    setResults((prev) => ({ ...prev, [question.id]: { score, status } }))
  }

  // ── Start screen ──────────────────────────────────────────────
  if (phase === "start") {
    return (
      <div className="flex items-center justify-center min-h-full p-4 sm:p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl mx-auto">
            {subject.icon ?? "📚"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-muted-foreground mt-1">{t.card_test_title}</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4 text-start">
              {([
                [t.nav_questions, t.test_random_questions],
                [t.test_label_duration, t.test_time_limit],
                [t.test_label_scoring, t.test_scoring],
                [t.test_label_after_submit, t.test_after_submit],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-end">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          {questionCount < 20 ? (
            <p className="text-sm text-destructive">
              {t.test_not_enough.replace("{count}", String(questionCount))}
            </p>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={handleStart}
              disabled={isPending}
            >
              {isPending ? t.test_preparing : t.test_start}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!testData) return null

  const question = testData.questions[currentIndex]
  const selected = answers[question.id] ?? []
  const confirmedResult = results[question.id] ?? null
  const isConfirmed = !!confirmedResult
  const confirmedCount = Object.keys(results).length
  const liveScore = Object.values(results).reduce((sum, r) => sum + r.score, 0)
  const progressPct = (confirmedCount / testData.questions.length) * 100
  const timerWarning = secondsLeft <= 60
  const allConfirmed = confirmedCount === testData.questions.length

  // Next unanswered question after current index, wrapping around
  const nextUnansweredIndex = (() => {
    const qs = testData.questions
    for (let i = currentIndex + 1; i < qs.length; i++) {
      if (!results[qs[i].id]) return i
    }
    for (let i = 0; i < currentIndex; i++) {
      if (!results[qs[i].id]) return i
    }
    return null // all confirmed
  })()

  // ── Active test ───────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Timer bar */}
      <div
        className={`border-b px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 transition-colors ${
          timerWarning ? "bg-red-50 dark:bg-red-950/20" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 text-sm font-medium shrink-0">
          <Timer className={`h-4 w-4 ${timerWarning ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className={timerWarning ? "text-red-500 font-bold tabular-nums" : "tabular-nums"}>
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentIndex + 1}/{testData.questions.length}</span>
            <span className="font-medium tabular-nums">
              {liveScore.toFixed(2)}/{confirmedCount} pts
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <Button
          size="sm"
          variant={phase === "submitting" ? "default" : "outline"}
          onClick={() => handleSubmit(false)}
          disabled={phase === "submitting"}
          className="shrink-0 px-2 sm:px-3"
        >
          <Flag className="h-3.5 w-3.5 sm:me-1.5" />
          <span className="hidden sm:inline">
            {phase === "submitting" ? t.test_submitting : t.test_submit_btn}
          </span>
        </Button>
      </div>

      {/* Question dots — single scrolling row on sm+, 2-row grid on mobile */}
      <div className="border-b px-3 sm:px-6 py-2">
        <div className="grid grid-cols-10 gap-1 sm:flex sm:flex-wrap sm:gap-1">
          {testData.questions.map((q, i) => {
            const result = results[q.id]
            const isCurrent = i === currentIndex
            let dotStyle = "bg-muted text-muted-foreground hover:bg-muted/80"
            if (isCurrent) {
              dotStyle = "bg-primary text-primary-foreground"
            } else if (result) {
              if (result.status === "correct") dotStyle = "bg-green-500 text-white"
              else if (result.status === "partial") dotStyle = "bg-yellow-400 text-white"
              else dotStyle = "bg-red-400 text-white"
            } else if ((answers[q.id] ?? []).length > 0) {
              dotStyle = "bg-primary/20 text-primary hover:bg-primary/30"
            }
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-6 w-full sm:w-6 rounded text-xs font-medium transition-colors ${dotStyle}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Q{currentIndex + 1} {t.question_of} {testData.questions.length}
            </span>
            {question.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">
                {question.difficulty}
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <p className="font-medium leading-relaxed">{question.question_text}</p>
              {!isConfirmed && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t.select_all_correct}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {question.answer_options.map((option) => {
                const isSelected = selected.includes(option.id)

                let rowStyle = isSelected
                  ? "border-primary bg-primary/5 cursor-pointer"
                  : "border-border bg-background hover:bg-muted/50 cursor-pointer"

                if (isConfirmed) {
                  if (option.is_correct && isSelected) {
                    rowStyle = "border-green-500 bg-green-50 dark:bg-green-950/20 cursor-default"
                  } else if (option.is_correct && !isSelected) {
                    rowStyle = "border-green-300 bg-green-50/50 dark:bg-green-950/10 cursor-default"
                  } else if (!option.is_correct && isSelected) {
                    rowStyle = "border-red-500 bg-red-50 dark:bg-red-950/20 cursor-default"
                  } else {
                    rowStyle = "border-border bg-background opacity-50 cursor-default"
                  }
                }

                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${rowStyle}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOption(question.id, option.id)}
                      disabled={isConfirmed}
                      className="mt-0.5"
                    />
                    <span className="flex-1 text-sm leading-relaxed">{option.option_text}</span>
                    {isConfirmed && option.is_correct && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 shrink-0">
                        ✓ {t.test_opt_correct}
                      </span>
                    )}
                    {isConfirmed && !option.is_correct && isSelected && (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                        ✗ {t.test_opt_incorrect}
                      </span>
                    )}
                  </label>
                )
              })}

              {/* Confirm button / result */}
              {!isConfirmed ? (
                <Button
                  className="w-full mt-2"
                  disabled={selected.length === 0}
                  onClick={() => confirmAnswer(question)}
                >
                  <CheckCircle2 className="h-4 w-4 me-2" />
                  {t.test_confirm_answer}
                </Button>
              ) : (
                <div
                  className={`mt-2 rounded-lg px-4 py-3 flex items-center justify-between text-sm font-medium ${
                    confirmedResult.status === "correct"
                      ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200"
                      : confirmedResult.status === "partial"
                      ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200"
                      : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
                  }`}
                >
                  <span>
                    {confirmedResult.status === "correct" && t.test_correct}
                    {confirmedResult.status === "partial" && t.test_partial}
                    {confirmedResult.status === "wrong" && t.test_incorrect}
                  </span>
                  <span className="tabular-nums font-bold">
                    +{confirmedResult.score.toFixed(2)} pts
                  </span>
                </div>
              )}

              {/* Explanation (shown after confirm) */}
              {isConfirmed && question.explanation && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">{t.explanation_label}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 me-1" />
              {t.test_prev}
            </Button>

            {allConfirmed ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={phase === "submitting"}
              >
                <Flag className="h-4 w-4 me-1" />
                {phase === "submitting" ? t.test_submitting : t.test_finish}
              </Button>
            ) : (
              <Button
                onClick={() => nextUnansweredIndex !== null && setCurrentIndex(nextUnansweredIndex)}
                disabled={nextUnansweredIndex === null}
                variant={isConfirmed ? "default" : "outline"}
              >
                {t.test_next}
                <ArrowRight className="h-4 w-4 ms-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
