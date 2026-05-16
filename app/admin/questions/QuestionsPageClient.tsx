"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QuestionsImportClient } from "./QuestionsImportClient"
import { QuestionsManageClient } from "./QuestionsManageClient"

interface Subject {
  id: string
  name: string
  icon: string | null
}

interface Props {
  subjects: Subject[]
}

export function QuestionsPageClient({ subjects }: Props) {
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Questions</h1>
      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-4">
          <QuestionsManageClient subjects={subjects} />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <QuestionsImportClient subjects={subjects} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
