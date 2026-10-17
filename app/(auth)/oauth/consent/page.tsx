import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsentButtons } from "./ConsentButtons"

interface Props {
  searchParams: Promise<{ authorization_id?: string }>
}

// Supabase Auth's OAuth server sends users here (Authorization Path) when an
// MCP client such as claude.ai asks to connect on their behalf.
export default async function OAuthConsentPage({ searchParams }: Props) {
  const { authorization_id: authorizationId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId ?? ""}`)}`)

  const [{ data: details, error }, { data: profile }] = await Promise.all([
    authorizationId
      ? supabase.auth.oauth.getAuthorizationDetails(authorizationId)
      : Promise.resolve({ data: null, error: null }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ])

  // Already consented earlier: send the user straight back to the client
  if (details && !("authorization_id" in details)) redirect(details.redirect_url)

  const isTutor = profile?.role === "tutor"

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">QCM Révision</h1>
        </div>

        <Card>
          {!details || error ? (
            <CardHeader>
              <CardTitle className="text-lg">Demande invalide</CardTitle>
              <CardDescription>
                Cette demande d&apos;autorisation est introuvable ou a expiré. Relancez la connexion depuis votre application.
              </CardDescription>
            </CardHeader>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Connecter {details.client.name || "une application"}
                </CardTitle>
                <CardDescription>
                  {isTutor
                    ? "Cette application pourra voir vos classes et créer des classes, des matières et des questions en votre nom."
                    : "Seuls les tuteurs peuvent connecter une application. Votre compte n'a pas le rôle tuteur."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>Compte : <span className="font-medium text-foreground">{details.user.email}</span></p>
                  <p className="break-all">Redirection : {details.redirect_uri}</p>
                </div>
                <ConsentButtons authorizationId={details.authorization_id} canApprove={isTutor} />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
