import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/AppSidebar"
import { MobileNav } from "@/components/MobileNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} profile={profile} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      <MobileNav isAdmin={true} />
    </div>
  )
}
