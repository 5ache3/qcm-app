import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { BookMarked, ClipboardList, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single()

  const [{ count: subjectCount }, { count: testCount }] = await Promise.all([
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase
      .from("tests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("status", "completed"),
  ])

  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard_greeting}{firstName ? `, ${firstName}` : ""} 👋</h1>
        <p className="text-muted-foreground mt-1">{t.dashboard_subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stat_subjects}</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stat_tests_completed}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="h-5 w-5" />
              {t.card_practice_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">{t.card_practice_desc}</p>
            <Button asChild className="mt-4">
              <Link href="/subjects">{t.choose_subject}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5" />
              {t.card_test_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">{t.card_test_desc}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/subjects">{t.choose_subject}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
