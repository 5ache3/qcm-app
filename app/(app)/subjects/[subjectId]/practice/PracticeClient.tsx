"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CheckCircle2, List } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { QuestionStatusBadge } from "@/components/QuestionStatusBadge"
import { calculateQuestionScore, getQuestionStatus } from "@/lib/scoring"
import { useT } from "@/lib/i18n-client"
import { saveAnswer } from "./actions"

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

interface ExistingAnswer {
  selected_option_ids: string[]
  score: number
  status: string
}

interface Props {
  subject: { id: string; name: string; icon: string | null }
  questions: Question[]
  existingAnswers: Record<string, ExistingAnswer>
  userId: string
}

export function PracticeClient({ subject, questions, existingAnswers, userId }: Props) {
  const t = useT()
  const shuffledQuestions = questions

  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = shuffledQuestions.findIndex((q) => !existingAnswers[q.id])
    return firstUnanswered === -1 ? 0 : firstUnanswered
  })
  const [localAnswers, setLocalAnswers] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const [qId, ans] of Object.entries(existingAnswers)) {
      map[qId] = ans.selected_option_ids
    }
    return map
  })
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const qId of Object.keys(existingAnswers)) {
      map[qId] = true
    }
    return map
  })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const activeSheetItemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!sheetOpen) return
    // Wait one frame for the sheet DOM to render before scrolling
    const id = requestAnimationFrame(() => {
      activeSheetItemRef.current?.scrollIntoView({ block: "center", behavior: "instant" })
    })
    return () => cancelAnimationFrame(id)
  }, [sheetOpen])

  const question = shuffledQuestions[currentIndex]
  const correctIds = question.answer_options.filter((o) => o.is_correct).map((o) => o.id)
  const selected = localAnswers[question.id] ?? []
  const isSubmitted = submitted[question.id] ?? false
  const status = isSubmitted ? getQuestionStatus(selected, correctIds) : null

  function toggleOption(optionId: string) {
    if (isSubmitted) return
    setLocalAnswers((prev) => {
      const current = prev[question.id] ?? []
      return {
        ...prev,
        [question.id]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
  }

  function handleSubmit() {
    const score = calculateQuestionScore(selected, correctIds)
    const questionStatus = getQuestionStatus(selected, correctIds)

    setSubmitted((prev) => ({ ...prev, [question.id]: true }))

    startTransition(async () => {
      const result = await saveAnswer({
        userId,
        subjectId: subject.id,
        questionId: question.id,
        selectedOptionIds: selected,
        score,
        status: questionStatus === "unanswered" ? "wrong" : questionStatus,
      })
      if (!result.success) toast.error(t.save_error_toast)
    })
  }

  function handleNext() {
    if (currentIndex < shuffledQuestions.length - 1) setCurrentIndex((i) => i + 1)
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  function jumpTo(index: number) {
    setCurrentIndex(index)
    setSheetOpen(false)
  }

  const totalAnswered = Object.keys(submitted).length
  const totalCorrect = shuffledQuestions.filter((q) => {
    const s = submitted[q.id]
    if (!s) return false
    const sel = localAnswers[q.id] ?? []
    const corr = q.answer_options.filter((o) => o.is_correct).map((o) => o.id)
    return getQuestionStatus(sel, corr) === "correct"
  }).length

  function QuestionList() {
    return (
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
        {shuffledQuestions.map((q, i) => {
          const sel = localAnswers[q.id] ?? []
          const corr = q.answer_options.filter((o) => o.is_correct).map((o) => o.id)
          const s = submitted[q.id] ? getQuestionStatus(sel, corr) : "unanswered"
          const isCurrent = i === currentIndex

          return (
            <button
              key={q.id}
              ref={isCurrent ? activeSheetItemRef : null}
              onClick={() => jumpTo(i)}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors w-full ${isCurrent
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted text-muted-foreground"
                }`}
            >
              <span className="shrink-0 w-5 text-xs font-mono">{i + 1}.</span>
              <span className="truncate flex-1">{q.question_text.slice(0, 40)}…</span>
              <span className="shrink-0 text-base leading-none">
                {s === "correct" && <span className="text-green-600">✓</span>}
                {s === "partial" && <span className="text-yellow-600">~</span>}
                {s === "wrong" && <span className="text-red-500">✗</span>}
                {s === "unanswered" && <span className="text-muted-foreground/40">·</span>}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-4rem)] md:h-dvh">
      {/* Header */}
      <div className="border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/subjects/${subject.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="font-semibold text-sm">{subject.icon ?? "📚"} {subject.name}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{totalAnswered}/{shuffledQuestions.length} {t.answered_label}</span>
          {totalAnswered > 0 && (
            <Badge variant="success" className="hidden sm:inline-flex">{totalCorrect} {t.correct_label}</Badge>
          )}
          {/* Questions list button — always visible */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">{t.practice_questions_btn}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {totalAnswered}/{shuffledQuestions.length}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80 flex flex-col p-0">
              <SheetHeader className="px-4 py-3 border-b shrink-0">
                <SheetTitle className="text-sm">{t.practice_all_questions}</SheetTitle>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><span className="text-green-600 font-bold">✓</span> {t.correct_label}</span>
                  <span className="flex items-center gap-1"><span className="text-yellow-600 font-bold">~</span> {t.test_partial}</span>
                  <span className="flex items-center gap-1"><span className="text-red-500 font-bold">✗</span> {t.test_incorrect}</span>
                  <span className="flex items-center gap-1"><span className="text-muted-foreground/40 font-bold">·</span> {t.practice_unanswered}</span>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-3">
                <QuestionList />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question list sidebar — large screens only */}
        <div className="hidden lg:flex w-56 flex-col border-r overflow-y-auto p-3 gap-1">
          {shuffledQuestions.map((q, i) => {
            const sel = localAnswers[q.id] ?? []
            const corr = q.answer_options.filter((o) => o.is_correct).map((o) => o.id)
            const s = submitted[q.id] ? getQuestionStatus(sel, corr) : "unanswered"
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors w-full ${i === currentIndex
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <span className="shrink-0 w-5 text-xs">{i + 1}.</span>
                <span className="truncate flex-1">{q.question_text.slice(0, 30)}…</span>
                <span className="shrink-0">
                  {s === "correct" && <span className="text-green-600">✓</span>}
                  {s === "partial" && <span className="text-yellow-600">~</span>}
                  {s === "wrong" && <span className="text-red-500">✗</span>}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main question area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Q{currentIndex + 1} {t.question_of} {shuffledQuestions.length}
              </span>
              <div className="flex items-center gap-2">
                {question.difficulty && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {question.difficulty}
                  </Badge>
                )}
                {isSubmitted && status && <QuestionStatusBadge status={status} />}
              </div>
            </div>

            <Card>
              <CardHeader>
                <p className="font-medium leading-relaxed">{question.question_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.select_all_correct}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {question.answer_options.map((option) => {
                  const isSelected = selected.includes(option.id)
                  const showResult = isSubmitted

                  let optionStyle = "border-border bg-background"
                  if (showResult) {
                    if (option.is_correct) {
                      optionStyle = "border-green-500 bg-green-50 dark:bg-green-950/20"
                    } else if (isSelected && !option.is_correct) {
                      optionStyle = "border-red-500 bg-red-50 dark:bg-red-950/20"
                    }
                  } else if (isSelected) {
                    optionStyle = "border-primary bg-primary/5"
                  }

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${optionStyle} ${isSubmitted ? "cursor-default" : "hover:bg-muted/50"
                        }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(option.id)}
                        disabled={isSubmitted}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-relaxed">{option.option_text}</span>
                    </label>
                  )
                })}
              </CardContent>
            </Card>

            {isSubmitted && question.explanation && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    {t.explanation_label}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-around">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Button>

              <div className="flex gap-2">
                {!isSubmitted && (
                  <Button onClick={handleSubmit} disabled={isPending}>
                    <CheckCircle2 className="h-4 w-4 me-1" />
                    {t.confirm_answer}
                  </Button>
                )}
              </div>

              {currentIndex < shuffledQuestions.length - 1 && (
                <Button variant={isSubmitted ? "default" : "outline"} onClick={handleNext}>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {isSubmitted && !question.explanation && <Separator />}
          </div>
        </div>
      </div>
    </div>
  )
}
