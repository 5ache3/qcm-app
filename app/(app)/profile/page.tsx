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

  return (
    <ProfileClient
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      role={profile?.role ?? "student"}
      status={(profile?.status as string) ?? "pending"}
    />
  )
}
