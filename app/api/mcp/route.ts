import { createMcpHandler, withMcpAuth } from "mcp-handler"
import type { AuthInfo } from "@modelcontextprotocol/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { hashMcpToken } from "@/lib/mcp-tokens"

// The admin client bypasses RLS, so every tool must scope its queries to the
// authenticated tutor's own classes.

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean }

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true }
}

function getTutorId(authInfo: AuthInfo | undefined) {
  const tutorId = authInfo?.extra?.tutorId
  if (typeof tutorId !== "string") throw new Error("Unauthenticated")
  return tutorId
}

async function tutorOwnsClass(tutorId: string, classId: string) {
  const { data } = await createAdminClient()
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("tutor_id", tutorId)
    .maybeSingle()
  return !!data
}

const questionSchema = z.object({
  question_text: z.string().min(1),
  explanation: z.string().optional().describe("Shown to students after they answer"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  options: z
    .array(z.object({ option_text: z.string().min(1), is_correct: z.boolean() }))
    .min(2)
    .describe("At least 2 options; one or more may be correct"),
})

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_classes",
      {
        title: "List my classes",
        description:
          "List the tutor's classes with invite codes, student counts, and their subjects (matières) with question counts.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        const supabase = createAdminClient()

        const { data: classes, error } = await supabase
          .from("classes")
          .select("id, name, description, invite_code, created_at")
          .eq("tutor_id", tutorId)
          .order("created_at", { ascending: false })
        if (error) return fail(error.message)

        const classIds = (classes ?? []).map((c) => c.id)
        if (classIds.length === 0) return ok([])

        const [{ data: memberships }, { data: subjects }] = await Promise.all([
          supabase.from("class_memberships").select("class_id, status").in("class_id", classIds),
          supabase.from("subjects").select("id, name, description, due_date, class_id").in("class_id", classIds),
        ])

        const subjectIds = (subjects ?? []).map((s) => s.id)
        const { data: questions } = subjectIds.length > 0
          ? await supabase.from("questions").select("subject_id").in("subject_id", subjectIds)
          : { data: [] }

        const questionCountMap: Record<string, number> = {}
        for (const q of questions ?? []) {
          questionCountMap[q.subject_id] = (questionCountMap[q.subject_id] ?? 0) + 1
        }

        return ok(
          (classes ?? []).map((c) => {
            const members = (memberships ?? []).filter((m) => m.class_id === c.id)
            return {
              ...c,
              approved_students: members.filter((m) => m.status === "approved").length,
              pending_students: members.filter((m) => m.status === "pending").length,
              subjects: (subjects ?? [])
                .filter((s) => s.class_id === c.id)
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  due_date: s.due_date,
                  question_count: questionCountMap[s.id] ?? 0,
                })),
            }
          })
        )
      }
    )

    server.registerTool(
      "create_class",
      {
        title: "Create a class",
        description: "Create a new class. Returns its id and the invite code students use to join.",
        inputSchema: z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        }),
      },
      async ({ name, description }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        const { data, error } = await createAdminClient()
          .from("classes")
          .insert({ name: name.trim(), description: description?.trim() || null, tutor_id: tutorId })
          .select("id, name, invite_code")
          .single()
        if (error) return fail(error.message)
        return ok(data)
      }
    )

    server.registerTool(
      "create_subject",
      {
        title: "Create a subject (matière)",
        description: "Create a subject (matière) inside one of the tutor's classes.",
        inputSchema: z.object({
          class_id: z.string().uuid(),
          name: z.string().min(1),
          description: z.string().optional(),
          due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD"),
        }),
      },
      async ({ class_id, name, description, due_date }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        if (!(await tutorOwnsClass(tutorId, class_id))) return fail("Class not found or not yours")

        const { data, error } = await createAdminClient()
          .from("subjects")
          .insert({ class_id, name: name.trim(), description: description?.trim() || null, due_date: due_date ?? null })
          .select("id, name, class_id")
          .single()
        if (error) return fail(error.message)
        return ok(data)
      }
    )

    server.registerTool(
      "add_questions",
      {
        title: "Add QCM questions to a subject",
        description:
          "Add multiple-choice questions to a subject in one of the tutor's classes. Each question needs at least 2 options and at least one correct option; several options may be correct.",
        inputSchema: z.object({
          subject_id: z.string().uuid(),
          questions: z.array(questionSchema).min(1).max(50),
        }),
      },
      async ({ subject_id, questions }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        const supabase = createAdminClient()

        const { data: subject } = await supabase
          .from("subjects")
          .select("id, class_id")
          .eq("id", subject_id)
          .maybeSingle()
        if (!subject?.class_id || !(await tutorOwnsClass(tutorId, subject.class_id))) {
          return fail("Subject not found or not in one of your classes")
        }

        const invalid = questions.findIndex((q) => !q.options.some((o) => o.is_correct))
        if (invalid !== -1) return fail(`Question ${invalid + 1} has no correct option; nothing was added`)

        const created: string[] = []
        const errors: string[] = []
        for (const [i, q] of questions.entries()) {
          const { data: question, error } = await supabase
            .from("questions")
            .insert({
              subject_id,
              question_text: q.question_text,
              explanation: q.explanation ?? null,
              difficulty: q.difficulty ?? null,
            })
            .select("id")
            .single()
          if (error || !question) {
            errors.push(`Question ${i + 1}: ${error?.message ?? "insert failed"}`)
            continue
          }

          const { error: optionsError } = await supabase.from("answer_options").insert(
            q.options.map((o, position) => ({
              question_id: question.id,
              option_text: o.option_text,
              is_correct: o.is_correct,
              position,
            }))
          )
          if (optionsError) {
            // Don't leave a question without options behind
            await supabase.from("questions").delete().eq("id", question.id)
            errors.push(`Question ${i + 1}: ${optionsError.message}`)
            continue
          }
          created.push(question.id)
        }

        const result = ok({ created: created.length, question_ids: created, errors })
        return errors.length > 0 && created.length === 0 ? { ...result, isError: true } : result
      }
    )
  },
  { serverInfo: { name: "qcm-tutor", version: "1.0.0" } }
)

// Personal access token generated on /tutor (Claude Code, Cursor…)
async function verifyPersonalToken(bearerToken: string): Promise<AuthInfo | undefined> {
  const supabase = createAdminClient()
  const { data: token } = await supabase
    .from("mcp_tokens")
    .select("id, tutor_id, profiles(role)")
    .eq("token_hash", hashMcpToken(bearerToken))
    .maybeSingle()
  if (!token) return undefined

  // Re-check the role on every request so demoted tutors lose access immediately
  const profile = Array.isArray(token.profiles) ? token.profiles[0] : token.profiles
  if (profile?.role !== "tutor") return undefined

  await supabase.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", token.id)

  return { token: bearerToken, clientId: token.id, scopes: [], extra: { tutorId: token.tutor_id } }
}

// Access token issued by Supabase Auth's OAuth server (claude.ai connectors)
async function verifyOAuthToken(bearerToken: string): Promise<AuthInfo | undefined> {
  const supabase = createAdminClient()
  const { data } = await supabase.auth.getClaims(bearerToken)
  const claims = data?.claims
  // Only accept tokens minted for an OAuth client, not regular app sessions
  if (!claims?.sub || typeof claims.client_id !== "string") return undefined

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.sub).single()
  if (profile?.role !== "tutor") return undefined

  return {
    token: bearerToken,
    clientId: claims.client_id,
    scopes: [],
    expiresAt: claims.exp,
    extra: { tutorId: claims.sub },
  }
}

async function verifyToken(_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined
  return bearerToken.startsWith("qcm_") ? verifyPersonalToken(bearerToken) : verifyOAuthToken(bearerToken)
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource/api/mcp",
})

export { authHandler as GET, authHandler as POST }
