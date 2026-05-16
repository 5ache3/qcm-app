import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookMarked, ClipboardList, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: subjectCount },
    { count: questionCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Subjects", value: subjectCount ?? 0, icon: BookMarked, href: "/admin/subjects" },
          { label: "Questions", value: questionCount ?? 0, icon: ClipboardList, href: "/admin/questions" },
          { label: "Users", value: userCount ?? 0, icon: Users, href: "/admin/users" },
        ].map(({ label, value, icon: Icon, href }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{value}</div>
              <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs">
                <Link href={href}>Manage →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
