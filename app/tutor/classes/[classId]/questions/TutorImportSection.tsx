"use client"

import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseCSV } from "@/app/admin/questions/parseCSV"
import { parseJSON } from "@/app/admin/questions/parseJSON"
import { importTutorQuestions } from "./actions"
import type { ParsedQuestion } from "@/app/admin/questions/parseCSV"

const SAMPLE_JSON = JSON.stringify(
  [
    {
      question_text: "Quelle est la capitale de la France ?",
      explanation: "Paris est la capitale et la plus grande ville de France.",
      difficulty: "easy",
      lesson: "Géographie",
      options: [
        { text: "Paris", correct: true },
        { text: "Lyon", correct: false },
        { text: "Marseille", correct: false },
        { text: "Bordeaux", correct: false },
      ],
    },
    {
      question_text: "Lesquels de ces nombres sont premiers ?",
      difficulty: "medium",
      lesson: "Mathématiques",
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

function downloadSample() {
  const blob = new Blob([SAMPLE_JSON], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "questions_exemple.json"
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  classId: string
  subjectId: string
  onImported: () => void
}

export function TutorImportSection({ classId, subjectId, onImported }: Props) {
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
    if (!preview || preview.length === 0) return
    startTransition(async () => {
      try {
        const result = await importTutorQuestions(classId, subjectId, preview)
        if ("error" in result) { toast.error(result.error); return }
        toast.success(`${result.imported} question${result.imported !== 1 ? "s" : ""} importée${result.imported !== 1 ? "s" : ""}.`)
        setPreview(null)
        setParseErrors([])
        setDetectedFormat(null)
        if (fileRef.current) fileRef.current.value = ""
        onImported()
      } catch {
        toast.error("Erreur lors de l'importation.")
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">Importer depuis un fichier JSON ou CSV</p>
        <Button variant="outline" size="sm" onClick={downloadSample} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Exemple JSON
        </Button>
      </div>

      <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/30 p-6 cursor-pointer transition-colors">
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <span className="text-sm font-medium">Choisir un fichier</span>
        <span className="text-xs text-muted-foreground mt-1">.json ou .csv</span>
        {detectedFormat && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {detectedFormat.toUpperCase()} détecté
          </Badge>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      {parseErrors.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-3 pb-3 space-y-1">
            <p className="text-sm font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              {parseErrors.length} avertissement{parseErrors.length > 1 ? "s" : ""}
            </p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5 list-disc list-inside">
              {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {preview && preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2">
              Aperçu
              <Badge variant="secondary">{preview.length} question{preview.length !== 1 ? "s" : ""}</Badge>
            </p>
            <Button size="sm" onClick={handleImport} disabled={isPending} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "Importation…" : `Importer ${preview.length}`}
            </Button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
            {preview.map((q, i) => (
              <Card key={i} className="text-sm">
                <CardContent className="pt-3 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{q.question_text}</p>
                    <div className="flex gap-1 shrink-0">
                      {q.difficulty && (
                        <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                      )}
                      {q.lesson && (
                        <Badge variant="outline" className="text-xs">📖 {q.lesson}</Badge>
                      )}
                    </div>
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
