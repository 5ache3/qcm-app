import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import { getTheme, THEME_COOKIE } from "@/lib/theme"
import { redirect } from "next/navigation"
import { ProfileClient } from "./ProfileClient"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single()

  const role = profile?.role ?? "student"
  const [{ t }, cookieStore] = await Promise.all([getServerT(), cookies()])

  // Small identity-card stats, depending on the role
  const stats: Array<{ label: string; value: number }> = []
  if (role === "tutor") {
    const { data: classes } = await supabase.from("classes").select("id").eq("tutor_id", user.id)
    const classIds = (classes ?? []).map((c) => c.id)
    const ids = classIds.length > 0 ? classIds : ["none"]
    const [{ count: subjectCount }, { count: studentCount }] = await Promise.all([
      supabase.from("subjects").select("*", { count: "exact", head: true }).in("class_id", ids),
      supabase.from("class_memberships").select("*", { count: "exact", head: true }).in("class_id", ids).eq("status", "approved"),
    ])
    stats.push(
      { label: t.profile_stat_classes, value: classIds.length },
      { label: t.stat_subjects, value: subjectCount ?? 0 },
      { label: t.profile_stat_students, value: studentCount ?? 0 },
    )
  } else if (role === "student") {
    const [{ count: classCount }, { count: answerCount }, { count: testCount }] = await Promise.all([
      supabase.from("class_memberships").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("status", "approved"),
      supabase.from("practice_answers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("tests").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    ])
    stats.push(
      { label: t.profile_stat_classes, value: classCount ?? 0 },
      { label: t.profile_stat_answers, value: answerCount ?? 0 },
      { label: t.stat_tests_completed, value: testCount ?? 0 },
    )
  }

  let classMemberships: Array<{ className: string; status: string }> = []
  if (role === "student") {
    const { data: memberships } = await supabase
      .from("class_memberships")
      .select("status, classes(name)")
      .eq("student_id", user.id)
      .order("joined_at", { ascending: false })
    classMemberships = (memberships ?? []).map((m) => ({
      className: (m.classes as unknown as { name: string } | null)?.name ?? "—",
      status: m.status,
    }))
  }

  return (
    <ProfileClient
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      role={role}
      status={(profile?.status as string) ?? "pending"}
      classMemberships={classMemberships}
      stats={stats}
      theme={getTheme(cookieStore.get(THEME_COOKIE)?.value)}
    />
  )
}
