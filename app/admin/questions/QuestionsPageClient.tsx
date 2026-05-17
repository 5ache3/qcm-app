"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QuestionsImportClient } from "./QuestionsImportClient"
import { QuestionsManageClient } from "./QuestionsManageClient"
import { useT } from "@/lib/i18n-client"

interface Subject {
  id: string
  name: string
  icon: string | null
}

interface Props {
  subjects: Subject[]
}

export function QuestionsPageClient({ subjects }: Props) {
  const t = useT()
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">{t.nav_questions}</h1>
      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">{t.admin_tab_manage}</TabsTrigger>
          <TabsTrigger value="import">{t.admin_tab_import}</TabsTrigger>
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
