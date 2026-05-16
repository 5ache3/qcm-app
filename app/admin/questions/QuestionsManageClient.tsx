"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getQuestionsForSubject,
  updateQuestion,
  deleteQuestion,
  updateAnswerOption,
  deleteAnswerOption,
  addAnswerOption,
  createQuestion,
} from "./manage-actions"

type AnswerOption = { id: string; option_text: string; is_correct: boolean; position: number }
type Question = {
  id: string
  question_text: string
  explanation: string | null
  difficulty: string | null
  answer_options: AnswerOption[]
}
type Subject = { id: string; name: string; icon: string | null }

interface Props {
  subjects: Subject[]
}

const DIFFICULTIES = ["easy", "medium", "hard"]
const PAGE_SIZE = 20

const TEXTAREA_CLASS =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export function QuestionsManageClient({ subjects }: Props) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [editingQuestion, setEditingQuestion] = useState<{
    id: string
    question_text: string
    explanation: string
    difficulty: string
  } | null>(null)
  const [editingOption, setEditingOption] = useState<{
    id: string
    option_text: string
    is_correct: boolean
  } | null>(null)
  const [newOption, setNewOption] = useState<{
    questionId: string
    option_text: string
    is_correct: boolean
  } | null>(null)

  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [newQ, setNewQ] = useState({ question_text: "", explanation: "", difficulty: "" })
  const [newQOptions, setNewQOptions] = useState([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
  ])

  async function loadQuestions(subjectId: string) {
    setLoading(true)
    const data = await getQuestionsForSubject(subjectId)
    setQuestions(data as Question[])
    setLoading(false)
    setPage(1)
    setExpandedId(null)
  }

  function selectSubject(id: string) {
    setSelectedSubjectId(id)
    setEditingQuestion(null)
    setEditingOption(null)
    setNewOption(null)
    setCreatingQuestion(false)
    loadQuestions(id)
  }

  const totalPages = Math.ceil(questions.length / PAGE_SIZE)
  const pagedQuestions = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function startEditQuestion(q: Question) {
    setEditingQuestion({
      id: q.id,
      question_text: q.question_text,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty ?? "",
    })
    setEditingOption(null)
    setNewOption(null)
    setExpandedId(q.id)
  }

  function handleSaveQuestion() {
    if (!editingQuestion) return
    startTransition(async () => {
      const res = await updateQuestion(editingQuestion.id, {
        question_text: editingQuestion.question_text,
        explanation: editingQuestion.explanation || null,
        difficulty: editingQuestion.difficulty || null,
      })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Question saved")
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                question_text: editingQuestion.question_text,
                explanation: editingQuestion.explanation || null,
                difficulty: editingQuestion.difficulty || null,
              }
            : q
        )
      )
      setEditingQuestion(null)
    })
  }

  function handleDeleteQuestion(questionId: string) {
    if (!confirm("Delete this question and all its options?")) return
    startTransition(async () => {
      const res = await deleteQuestion(questionId)
      if (res?.error) { toast.error(res.error); return }
      toast.success("Question deleted")
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    })
  }

  function startEditOption(opt: AnswerOption) {
    setEditingOption({ id: opt.id, option_text: opt.option_text, is_correct: opt.is_correct })
    setNewOption(null)
  }

  function handleSaveOption(questionId: string) {
    if (!editingOption) return
    startTransition(async () => {
      const res = await updateAnswerOption(editingOption.id, {
        option_text: editingOption.option_text,
        is_correct: editingOption.is_correct,
      })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Option saved")
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answer_options: q.answer_options.map((o) =>
                  o.id === editingOption.id
                    ? { ...o, option_text: editingOption.option_text, is_correct: editingOption.is_correct }
                    : o
                ),
              }
            : q
        )
      )
      setEditingOption(null)
    })
  }

  function handleDeleteOption(optionId: string, questionId: string) {
    startTransition(async () => {
      const res = await deleteAnswerOption(optionId)
      if (res?.error) { toast.error(res.error); return }
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer_options: q.answer_options.filter((o) => o.id !== optionId) }
            : q
        )
      )
    })
  }

  function handleAddOption(questionId: string) {
    if (!newOption || !newOption.option_text.trim()) return
    const question = questions.find((q) => q.id === questionId)
    const position = question ? question.answer_options.length : 0
    startTransition(async () => {
      const res = await addAnswerOption(questionId, {
        option_text: newOption.option_text,
        is_correct: newOption.is_correct,
        position,
      })
      if (res?.error) { toast.error(res.error); return }
      await loadQuestions(selectedSubjectId)
      setNewOption(null)
    })
  }

  function handleCreateQuestion() {
    if (!newQ.question_text.trim()) { toast.error("Question text is required"); return }
    const validOptions = newQOptions.filter((o) => o.option_text.trim())
    if (!validOptions.some((o) => o.is_correct)) { toast.error("At least one correct option is required"); return }
    startTransition(async () => {
      const res = await createQuestion(selectedSubjectId, {
        question_text: newQ.question_text,
        explanation: newQ.explanation || null,
        difficulty: newQ.difficulty || null,
        options: validOptions,
      })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Question created")
      setCreatingQuestion(false)
      setNewQ({ question_text: "", explanation: "", difficulty: "" })
      setNewQOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ])
      await loadQuestions(selectedSubjectId)
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Subject selector */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select subject</p>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subjects yet.{" "}
            <a href="/admin/subjects" className="underline">Create one first.</a>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSubject(s.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedSubjectId === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="text-xl">{s.icon ?? "📚"}</span>
                <span className="text-sm font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSubjectId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              Questions
              <Badge variant="secondary">{questions.length}</Badge>
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setCreatingQuestion(true)
                setExpandedId(null)
                setEditingQuestion(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New question
            </Button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {/* Create question form */}
          {creatingQuestion && (
            <Card className="border-primary/50">
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Question text *</Label>
                  <textarea
                    className={TEXTAREA_CLASS}
                    placeholder="Enter question…"
                    value={newQ.question_text}
                    onChange={(e) => setNewQ((prev) => ({ ...prev, question_text: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Explanation</Label>
                    <Input
                      placeholder="Optional"
                      value={newQ.explanation}
                      onChange={(e) => setNewQ((prev) => ({ ...prev, explanation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Difficulty</Label>
                    <select
                      className={SELECT_CLASS}
                      value={newQ.difficulty}
                      onChange={(e) => setNewQ((prev) => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="">None</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Options — check the correct ones</Label>
                  {newQOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox
                        checked={opt.is_correct}
                        onCheckedChange={(checked) =>
                          setNewQOptions((prev) =>
                            prev.map((o, j) => (j === i ? { ...o, is_correct: !!checked } : o))
                          )
                        }
                      />
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt.option_text}
                        onChange={(e) =>
                          setNewQOptions((prev) =>
                            prev.map((o, j) => (j === i ? { ...o, option_text: e.target.value } : o))
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => setNewQOptions((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNewQOptions((prev) => [...prev, { option_text: "", is_correct: false }])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add option
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={isPending} onClick={handleCreateQuestion}>
                    {isPending ? "Saving…" : "Create question"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCreatingQuestion(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions list */}
          <div className="space-y-2">
            {pagedQuestions.map((q) => {
              const isExpanded = expandedId === q.id
              const isEditingThis = editingQuestion?.id === q.id
              const sortedOptions = [...q.answer_options].sort((a, b) => a.position - b.position)

              return (
                <Card key={q.id}>
                  <CardContent className="p-0">
                    {/* Question header row */}
                    <div className="flex items-start gap-3 p-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        {isEditingThis ? (
                          <textarea
                            className={`${TEXTAREA_CLASS} min-h-[60px]`}
                            value={editingQuestion.question_text}
                            onChange={(e) =>
                              setEditingQuestion((prev) =>
                                prev ? { ...prev, question_text: e.target.value } : null
                              )
                            }
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                            {q.difficulty && (
                              <Badge variant="outline" className="mt-1 text-xs capitalize">
                                {q.difficulty}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditingThis ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600"
                              disabled={isPending}
                              onClick={handleSaveQuestion}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingQuestion(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => startEditQuestion(q)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={isPending}
                              onClick={() => handleDeleteQuestion(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-3">
                        {isEditingThis && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Explanation</Label>
                              <Input
                                placeholder="Optional"
                                value={editingQuestion.explanation}
                                onChange={(e) =>
                                  setEditingQuestion((prev) =>
                                    prev ? { ...prev, explanation: e.target.value } : null
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Difficulty</Label>
                              <select
                                className={SELECT_CLASS}
                                value={editingQuestion.difficulty}
                                onChange={(e) =>
                                  setEditingQuestion((prev) =>
                                    prev ? { ...prev, difficulty: e.target.value } : null
                                  )
                                }
                              >
                                <option value="">None</option>
                                {DIFFICULTIES.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {!isEditingThis && q.explanation && (
                          <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
                        )}

                        {/* Options */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Options
                          </p>
                          {sortedOptions.map((opt) => {
                            const isEditingOpt = editingOption?.id === opt.id
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                                  opt.is_correct
                                    ? "border-green-300 bg-green-50/50 dark:bg-green-950/10"
                                    : "border-border bg-muted/20"
                                }`}
                              >
                                {isEditingOpt ? (
                                  <>
                                    <Checkbox
                                      checked={editingOption.is_correct}
                                      onCheckedChange={(checked) =>
                                        setEditingOption((prev) =>
                                          prev ? { ...prev, is_correct: !!checked } : null
                                        )
                                      }
                                    />
                                    <Input
                                      className="h-7 text-xs"
                                      value={editingOption.option_text}
                                      onChange={(e) =>
                                        setEditingOption((prev) =>
                                          prev ? { ...prev, option_text: e.target.value } : null
                                        )
                                      }
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 shrink-0 text-green-600"
                                      disabled={isPending}
                                      onClick={() => handleSaveOption(q.id)}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 shrink-0"
                                      onClick={() => setEditingOption(null)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="shrink-0 text-muted-foreground">
                                      {opt.is_correct ? "✓" : "○"}
                                    </span>
                                    <span className="flex-1">{opt.option_text}</span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 shrink-0 text-muted-foreground"
                                      onClick={() => startEditOption(opt)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                      disabled={isPending}
                                      onClick={() => handleDeleteOption(opt.id, q.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )
                          })}

                          {/* Add option inline */}
                          {newOption?.questionId === q.id ? (
                            <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-2">
                              <Checkbox
                                checked={newOption.is_correct}
                                onCheckedChange={(checked) =>
                                  setNewOption((prev) => (prev ? { ...prev, is_correct: !!checked } : null))
                                }
                              />
                              <Input
                                className="h-7 text-xs"
                                placeholder="Option text…"
                                value={newOption.option_text}
                                autoFocus
                                onChange={(e) =>
                                  setNewOption((prev) =>
                                    prev ? { ...prev, option_text: e.target.value } : null
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddOption(q.id)
                                  if (e.key === "Escape") setNewOption(null)
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0 text-green-600"
                                disabled={isPending}
                                onClick={() => handleAddOption(q.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setNewOption(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() =>
                                setNewOption({ questionId: q.id, option_text: "", is_correct: false })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add option
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {!loading && questions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No questions yet. Import some or create one above.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
