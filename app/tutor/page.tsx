import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { GraduationCap, Users, BookMarked, Plus, ChevronRight, Copy, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TutorDashboardClient } from "./TutorDashboardClient"

export default async function TutorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, description, invite_code, created_at")
    .eq("tutor_id", user!.id)
    .order("created_at", { ascending: false })

  const classIds = (classes ?? []).map((c) => c.id)

  const [{ data: membershipCounts }, { data: subjectCounts }] = await Promise.all([
    supabase
      .from("class_memberships")
      .select("class_id, status")
      .in("class_id", classIds.length > 0 ? classIds : ["none"]),
    supabase
      .from("subjects")
      .select("class_id")
      .in("class_id", classIds.length > 0 ? classIds : ["none"]),
  ])

  const memberMap: Record<string, { pending: number; approved: number }> = {}
  for (const m of membershipCounts ?? []) {
    if (!memberMap[m.class_id]) memberMap[m.class_id] = { pending: 0, approved: 0 }
    if (m.status === "pending") memberMap[m.class_id].pending++
    else memberMap[m.class_id].approved++
  }

  const subjectMap: Record<string, number> = {}
  for (const s of subjectCounts ?? []) {
    if (s.class_id) subjectMap[s.class_id] = (subjectMap[s.class_id] ?? 0) + 1
  }

  return (
    <TutorDashboardClient
      classes={(classes ?? []).map((c) => ({
        ...c,
        memberCount: memberMap[c.id]?.approved ?? 0,
        pendingCount: memberMap[c.id]?.pending ?? 0,
        subjectCount: subjectMap[c.id] ?? 0,
      }))}
    />
  )
}
