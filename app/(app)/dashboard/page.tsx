import { createClient } from "@/lib/supabase/server"
import { BookMarked, ClipboardList, Trophy, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
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

  const firstName = profile?.full_name?.split(" ")[0] ?? "there"

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">Ready to study? Pick up where you left off.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
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
              Practice Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              Browse all questions for a subject and save your answers. Track which ones you got right, wrong, or partial.
            </p>
            <Button asChild className="mt-4">
              <Link href="/subjects">Choose a subject</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5" />
              Timed Test
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              Take a 20-question random test against the clock. Get a score and review every answer afterward.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/subjects">Pick a subject</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
