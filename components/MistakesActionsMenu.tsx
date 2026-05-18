"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, BookOpen, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ExportMistakesButton } from "@/components/ExportMistakesButton"
import type { MistakeItem } from "@/components/MistakesPDFDocument"

interface Props {
  subjectId: string
  subjectName: string
  mistakes: MistakeItem[]
  labels: {
    testMistakes: string
    practice: string
    actions: string
  }
}

export function MistakesActionsMenu({ subjectId, subjectName, mistakes, labels }: Props) {
  const [open, setOpen] = useState(false)

  const actionButtons = (
    <>
      <ExportMistakesButton subjectName={subjectName} mistakes={mistakes} />
      <Button variant="outline" size="sm" asChild>
        <Link href={`/mistakes/${subjectId}/tests`}>
          <ClipboardList className="h-3.5 w-3.5 me-1.5" />
          {labels.testMistakes}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/subjects/${subjectId}/practice`}>
          <BookOpen className="h-3.5 w-3.5 me-1.5" />
          {labels.practice}
        </Link>
      </Button>
    </>
  )

  return (
    <>
      {/* Desktop: inline buttons */}
      <div className="hidden sm:flex items-center gap-2">
        {actionButtons}
      </div>

      {/* Mobile: hamburger → Sheet */}
      <div className="sm:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{labels.actions}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{labels.actions}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              <ExportMistakesButton subjectName={subjectName} mistakes={mistakes} />
              <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
                <Link href={`/mistakes/${subjectId}/tests`}>
                  <ClipboardList className="h-3.5 w-3.5 me-1.5" />
                  {labels.testMistakes}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
                <Link href={`/subjects/${subjectId}/practice`}>
                  <BookOpen className="h-3.5 w-3.5 me-1.5" />
                  {labels.practice}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
