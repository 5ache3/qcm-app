"use client"

import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseCSV } from "./parseCSV"
import { parseJSON } from "./parseJSON"
import { importQuestions } from "./actions"
import type { ParsedQuestion } from "./parseCSV"

interface Subject {
  id: string
  name: string
  icon: string | null
}

interface Props {
  subjects: Subject[]
}

const SAMPLE_CSV = `question_text,explanation,difficulty,option_1,correct_1,option_2,correct_2,option_3,correct_3,option_4,correct_4
"What is the capital of France?","Paris is the capital and largest city of France.","easy","Paris",true,"London",false,"Berlin",false,"Madrid",false
"Which of the following are prime numbers?","A prime number has exactly two factors: 1 and itself.","medium","2",true,"3",true,"4",false,"5",true
"What does HTTP stand for?",,"easy","HyperText Transfer Protocol",true,"High Transfer Text Protocol",false,"HyperText Transmission Protocol",false,"Home Tool Transfer Protocol",false`

const SAMPLE_JSON = JSON.stringify(
  [
    {
      question_text: "What is the capital of France?",
      explanation: "Paris is the capital and largest city of France.",
      difficulty: "easy",
      options: [
        { text: "Paris", correct: true },
        { text: "London", correct: false },
        { text: "Berlin", correct: false },
        { text: "Madrid", correct: false },
      ],
    },
    {
      question_text: "Which of the following are prime numbers?",
      explanation: "A prime number has exactly two factors: 1 and itself.",
      difficulty: "medium",
      options: [
        { text: "2", correct: true },
        { text: "3", correct: true },
        { text: "4", correct: false },
        { text: "5", correct: true },
      ],
    },
  ],
  null,
  2
)

function downloadSample(format: "csv" | "json") {
  const content = format === "csv" ? SAMPLE_CSV : SAMPLE_JSON
  const mime = format === "csv" ? "text/csv" : "application/json"
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `questions_sample.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

export function QuestionsImportClient({ subjects }: Props) {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [preview, setPreview] = useState<ParsedQuestion[] | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [detectedFormat, setDetectedFormat] = useState<"csv" | "json" | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isJson = file.name.endsWith(".json") || file.type === "application/json"
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = isJson ? parseJSON(text) : parseCSV(text)
      setDetectedFormat(isJson ? "json" : "csv")
      setPreview(result.questions)
      setParseErrors(result.errors)
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!selectedSubject || !preview || preview.length === 0) return
    startTransition(async () => {
      try {
        const result = await importQuestions(selectedSubject, preview)
        toast.success(`Imported ${result.imported} questions`)
        setPreview(null)
        setParseErrors([])
        setDetectedFormat(null)
        if (fileRef.current) fileRef.current.value = ""
      } catch {
        toast.error("Import failed")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold">Import Questions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadSample("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadSample("json")}>
            <Download className="h-4 w-4 mr-2" />
            Sample JSON
          </Button>
        </div>
      </div>

      {/* Format guides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV format
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Required: <code className="bg-muted px-1 rounded">question_text</code></p>
            <p>Optional: <code className="bg-muted px-1 rounded">explanation</code> <code className="bg-muted px-1 rounded">difficulty</code></p>
            <p className="font-mono bg-muted p-1.5 rounded mt-1">
              option_1, correct_1, option_2, correct_2 …
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              JSON format
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Array of objects with <code className="bg-muted px-1 rounded">question_text</code></p>
            <p>Options array: <code className="bg-muted px-1 rounded">text</code> + <code className="bg-muted px-1 rounded">correct</code></p>
            <p className="font-mono bg-muted p-1.5 rounded mt-1">
              {"[{ question_text, options: [{ text, correct }] }]"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Step 1 — Pick subject */}
      <div className="space-y-3">
        <h2 className="font-semibold">1. Select subject</h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subjects yet.{" "}
            <a href="/admin/subjects" className="underline">Create one first.</a>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedSubject === s.id
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

      {/* Step 2 — Upload file */}
      <div className="space-y-3">
        <h2 className="font-semibold">2. Upload file</h2>
        <label
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
            selectedSubject
              ? "border-border hover:border-primary hover:bg-muted/30"
              : "border-border opacity-50 cursor-not-allowed"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">Click to upload CSV or JSON</span>
          <span className="text-xs text-muted-foreground mt-1">
            .csv or .json — UTF-8 encoded
          </span>
          {detectedFormat && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {detectedFormat.toUpperCase()} detected
            </Badge>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            disabled={!selectedSubject}
            onChange={handleFile}
          />
        </label>
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 space-y-1">
            <p className="text-sm font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              {parseErrors.length} warning{parseErrors.length > 1 ? "s" : ""}
            </p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5 list-disc list-inside">
              {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              3. Preview &amp; import
              <Badge variant="secondary">{preview.length} questions</Badge>
            </h2>
            <Button onClick={handleImport} disabled={isPending || !selectedSubject}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isPending ? "Importing…" : `Import ${preview.length} questions`}
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {preview.map((q, i) => (
              <Card key={i} className="text-sm">
                <CardContent className="pt-3 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{q.question_text}</p>
                    {q.difficulty && (
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {q.difficulty}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {q.options.map((opt, j) => (
                      <div
                        key={j}
                        className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                          opt.is_correct
                            ? "bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span>{opt.is_correct ? "✓" : "○"}</span>
                        <span className="truncate">{opt.option_text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
