"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ExportMistakesButton } from "@/components/ExportMistakesButton"
import type { MistakeItem } from "@/components/MistakesPDFDocument"

interface Props {
  subjectId: string
  subjectName: string
  mistakes: MistakeItem[]
  labels: {
    practiceMistakes: string
    actions: string
  }
}

export function TestMistakesActionsMenu({ subjectId, subjectName, mistakes, labels }: Props) {
  const [open, setOpen] = useState(false)

  const actionButtons = (
    <>
      <ExportMistakesButton subjectName={subjectName} mistakes={mistakes} filenameSuffix="test" />
      <Button variant="outline" size="sm" asChild>
        <Link href={`/mistakes/${subjectId}`}>
          <BookOpen className="h-3.5 w-3.5 me-1.5" />
          {labels.practiceMistakes}
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
              <ExportMistakesButton subjectName={subjectName} mistakes={mistakes} filenameSuffix="test" />
              <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
                <Link href={`/mistakes/${subjectId}`}>
                  <BookOpen className="h-3.5 w-3.5 me-1.5" />
                  {labels.practiceMistakes}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
