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
          if (expired) toast.info("Time's up! Your test has been submitted.")
          router.push(`/tests/${result.testId}/review`)
        } catch {
          toast.error("Failed to submit test. Please try again.")
          setPhase("active")
        }
      })
    },
    [testData, phase, secondsLeft, answers, router, startTransition]
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
      } catch (e: any) {
        toast.error(e.message ?? "Failed to start test")
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
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl mx-auto">
            {subject.icon ?? "📚"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-muted-foreground mt-1">Timed Test</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4 text-left">
              {[
                ["Questions", "20 random questions"],
                ["Time limit", "20 minutes"],
                ["Scoring", "Partial credit for partially correct answers"],
                ["After submit", "Full review with correct answers"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          {questionCount < 20 ? (
            <p className="text-sm text-destructive">
              Not enough questions ({questionCount}/20 available).
            </p>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={handleStart}
              disabled={isPending}
            >
              {isPending ? "Preparing test…" : "Begin Test"}
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
  const isLast = currentIndex === testData.questions.length - 1
  const timerWarning = secondsLeft <= 120

  // ── Active test ───────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Timer bar */}
      <div
        className={`border-b px-6 py-3 flex items-center justify-between gap-4 transition-colors ${
          timerWarning ? "bg-red-50 dark:bg-red-950/20" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Timer className={`h-4 w-4 ${timerWarning ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className={timerWarning ? "text-red-500 font-bold tabular-nums" : "tabular-nums"}>
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentIndex + 1} / {testData.questions.length}</span>
            <span className="font-medium tabular-nums">
              Score: {liveScore.toFixed(2)} / {confirmedCount}
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <Button
          size="sm"
          variant={phase === "submitting" ? "default" : "outline"}
          onClick={() => handleSubmit(false)}
          disabled={phase === "submitting"}
          className="shrink-0"
        >
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          {phase === "submitting" ? "Submitting…" : "Submit test"}
        </Button>
      </div>

      {/* Question dots */}
      <div className="border-b px-6 py-2 flex gap-1 overflow-x-auto">
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
              className={`h-6 w-6 shrink-0 rounded text-xs font-medium transition-colors ${dotStyle}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1}
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
                  Select all correct answers
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
                        ✓ correct
                      </span>
                    )}
                    {isConfirmed && !option.is_correct && isSelected && (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                        ✗ wrong
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
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm answer
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
                    {confirmedResult.status === "correct" && "Correct!"}
                    {confirmedResult.status === "partial" && "Partially correct"}
                    {confirmedResult.status === "wrong" && "Incorrect"}
                  </span>
                  <span className="tabular-nums font-bold">
                    +{confirmedResult.score.toFixed(2)} pts
                  </span>
                </div>
              )}

              {/* Explanation (shown after confirm) */}
              {isConfirmed && question.explanation && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">Explanation</p>
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
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {isLast ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={phase === "submitting"}
              >
                <Flag className="h-4 w-4 mr-1" />
                Finish & submit
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentIndex((i) => i + 1)}
                variant={isConfirmed ? "default" : "outline"}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
