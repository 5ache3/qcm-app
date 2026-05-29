import { createClient } from "@/lib/supabase/server"
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
    />
  )
}
