"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { MistakeItem } from "./MistakesPDFDocument"

interface Props {
  subjectName: string
  mistakes: MistakeItem[]
  filenameSuffix?: string
}

export function ExportMistakesButton({ subjectName, mistakes, filenameSuffix }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const [{ pdf }, { MistakesPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./MistakesPDFDocument"),
      ])

      const exportDate = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(
        React.createElement(MistakesPDFDocument, { subjectName, mistakes, exportDate }) as any
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const suffix = filenameSuffix ? `-${filenameSuffix}` : ""
      link.download = `${subjectName.toLowerCase().replace(/\s+/g, "-")}-erreurs${suffix}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF export failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading || mistakes.length === 0}
    >
      <Download className="h-3.5 w-3.5 me-1.5" />
      {loading ? "Génération…" : "Exporter PDF"}
    </Button>
  )
}
