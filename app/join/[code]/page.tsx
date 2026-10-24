import Link from "next/link"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClassCover } from "@/components/ClassCover"
import { JoinClassButton } from "./JoinClassButton"

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinClassPage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`)

  // Use admin client so RLS doesn't block a non-member from looking up the class
  const admin = createAdminClient()
  const { data: cls } = await admin
    .from("classes")
    .select("id, name, description, cover_url, tutor_id, profiles(full_name)")
    .eq("invite_code", code.trim().toLowerCase())
    .maybeSingle()

  const { data: membership } = cls
    ? await supabase
        .from("class_memberships")
        .select("status")
        .eq("class_id", cls.id)
        .eq("student_id", user.id)
        .maybeSingle()
    : { data: null }

  const tutor = cls?.profiles as { full_name: string | null } | null | undefined
  const isOwnClass = cls?.tutor_id === user.id

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {cls ? (
          <>
            <ClassCover name={cls.name} coverUrl={cls.cover_url} className="h-32" />
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Invitation à rejoindre la classe</p>
                <h1 className="text-xl font-semibold">{cls.name}</h1>
                {tutor?.full_name && (
                  <p className="text-sm text-muted-foreground">Enseignant : {tutor.full_name}</p>
                )}
                {cls.description && <p className="text-sm pt-1">{cls.description}</p>}
              </div>

              {isOwnClass ? (
                <p className="text-sm text-muted-foreground">C&apos;est votre classe. Partagez ce lien avec vos étudiants.</p>
              ) : membership?.status === "approved" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Vous êtes déjà membre de cette classe.</p>
                  <Button asChild className="w-full"><Link href="/dashboard">Aller au tableau de bord</Link></Button>
                </div>
              ) : (
                <JoinClassButton code={code} alreadyPending={membership?.status === "pending"} />
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="space-y-3 py-10 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Lien d&apos;invitation invalide</p>
            <p className="text-sm text-muted-foreground">
              Ce lien a peut-être expiré. Demandez un nouveau lien à votre enseignant.
            </p>
            <Button asChild variant="outline"><Link href="/dashboard">Retour au tableau de bord</Link></Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
