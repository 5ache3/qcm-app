import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassesSection } from "./ClassesSection"

export default async function DashboardPage() {
  const [supabase, { t }] = await Promise.all([createClient(), getServerT()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single()

  const isStudent = !profile?.role || profile.role === "student"
  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const { count: testCount } = await supabase
    .from("tests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "completed")

  let classes: Array<{
    classId: string
    className: string
    status: "pending" | "approved"
    subjects: Array<{ id: string; name: string; icon: string | null; due_date: string | null }>
  }> = []

  if (isStudent) {
    const { data: memberships } = await supabase
      .from("class_memberships")
      .select("class_id, status, classes(id, name)")
      .eq("student_id", user!.id)
      .order("joined_at", { ascending: false })

    const approvedIds = (memberships ?? [])
      .filter((m) => m.status === "approved")
      .map((m) => (m.classes as unknown as { id: string } | null)?.id)
      .filter(Boolean) as string[]

    const { data: subjectRows } = approvedIds.length > 0
      ? await supabase
          .from("subjects")
          .select("id, name, icon, due_date, class_id")
          .in("class_id", approvedIds)
          .order("name")
      : { data: [] as Array<{ id: string; name: string; icon: string | null; due_date: string | null; class_id: string | null }> }

    const subjectsByClass: Record<string, typeof subjectRows> = {}
    for (const s of subjectRows ?? []) {
      if (!s.class_id) continue
      if (!subjectsByClass[s.class_id]) subjectsByClass[s.class_id] = []
      subjectsByClass[s.class_id]!.push(s)
    }

    classes = (memberships ?? []).map((m) => {
      const cls = m.classes as unknown as { id: string; name: string } | null
      return {
        classId: cls?.id ?? "",
        className: cls?.name ?? "—",
        status: m.status as "pending" | "approved",
        subjects: (subjectsByClass[cls?.id ?? ""] ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          due_date: s.due_date,
        })),
      }
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {isStudent && <ClassesSection classes={classes} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.stat_tests_completed}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
