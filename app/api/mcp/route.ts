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

async function getOwnedSubject(tutorId: string, subjectId: string) {
  const { data: subject } = await createAdminClient()
    .from("subjects")
    .select("id, name, class_id")
    .eq("id", subjectId)
    .maybeSingle()
  if (!subject?.class_id || !(await tutorOwnsClass(tutorId, subject.class_id))) return null
  return subject
}

async function lessonInSubject(lessonId: string, subjectId: string) {
  const { data } = await createAdminClient()
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("subject_id", subjectId)
    .maybeSingle()
  return !!data
}

const IMAGE_BUCKET = "qcm-images"
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Refuse loopback, link-local and private-range hosts so the server can't be
// pointed at internal addresses
function isPublicHttpsUrl(raw: string) {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== "https:") return false
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return false
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false
  if (host.includes(":")) return false // IPv6 literals
  return true
}

// Downloads an image, stores it under <folder>/<ownerId>/ and saves its public
// URL in <table>.<column>; a null imageUrl clears the image. The previous file
// is removed from storage either way.
async function setStoredImage(
  target: { table: "classes" | "subjects"; column: "cover_url" | "logo_url"; folder: "classes" | "subjects" },
  ownerId: string,
  imageUrl: string | null
): Promise<ToolResult> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from(target.table).select(target.column).eq("id", ownerId).single()
  const previousUrl = (row as Record<string, string | null> | null)?.[target.column] ?? null

  let newUrl: string | null = null
  if (imageUrl) {
    if (!isPublicHttpsUrl(imageUrl)) return fail("image_url must be a public https URL")

    // Follow redirects by hand so every hop gets the same public-URL check
    let res: Response | null = null
    let nextUrl = imageUrl
    try {
      for (let hop = 0; hop < 4; hop++) {
        if (!isPublicHttpsUrl(nextUrl)) return fail("image_url must be a public https URL")
        const r = await fetch(nextUrl, { redirect: "manual", signal: AbortSignal.timeout(10_000) })
        const location = r.headers.get("location")
        if (r.status >= 300 && r.status < 400 && location) {
          nextUrl = new URL(location, nextUrl).toString()
          continue
        }
        res = r
        break
      }
    } catch {
      return fail("Could not download the image")
    }
    if (!res) return fail("Too many redirects")
    if (!res.ok) return fail(`Could not download the image (HTTP ${res.status})`)

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
    const ext = IMAGE_TYPES[contentType]
    if (!ext) return fail("Unsupported image type; use PNG, JPEG, WebP or GIF")

    const bytes = await res.arrayBuffer()
    if (bytes.byteLength > MAX_IMAGE_BYTES) return fail("Image is larger than 5 MB")

    const path = `${target.folder}/${ownerId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, { contentType })
    if (uploadError) return fail(uploadError.message)
    newUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
  }

  const { error } = await supabase.from(target.table).update({ [target.column]: newUrl }).eq("id", ownerId)
  if (error) return fail(error.message)

  const marker = `/object/public/${IMAGE_BUCKET}/`
  const i = previousUrl?.indexOf(marker) ?? -1
  if (previousUrl && i !== -1) {
    await supabase.storage.from(IMAGE_BUCKET).remove([decodeURIComponent(previousUrl.slice(i + marker.length))])
  }

  return ok({ id: ownerId, [target.column]: newUrl })
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
          .select("id, name, description, invite_code, cover_url, created_at")
          .eq("tutor_id", tutorId)
          .order("created_at", { ascending: false })
        if (error) return fail(error.message)

        const classIds = (classes ?? []).map((c) => c.id)
        if (classIds.length === 0) return ok([])

        const [{ data: memberships }, { data: subjects }] = await Promise.all([
          supabase.from("class_memberships").select("class_id, status").in("class_id", classIds),
          supabase.from("subjects").select("id, name, description, logo_url, due_date, class_id").in("class_id", classIds),
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
                  logo_url: s.logo_url,
                  due_date: s.due_date,
                  question_count: questionCountMap[s.id] ?? 0,
                })),
            }
          })
        )
      }
    )

    server.registerTool(
      "list_questions",
      {
        title: "List questions in a subject",
        description:
          "List the QCM questions of a subject (matière) in one of the tutor's classes, with their options and which are correct. Optionally filter to one lesson. Use it to review content or avoid adding duplicates. Paginated with limit/offset.",
        inputSchema: z.object({
          subject_id: z.string().uuid(),
          lesson_id: z.string().uuid().optional().describe("Only questions in this lesson"),
          limit: z.number().int().min(1).max(200).default(100),
          offset: z.number().int().min(0).default(0),
        }),
      },
      async ({ subject_id, lesson_id, limit, offset }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        const subject = await getOwnedSubject(tutorId, subject_id)
        if (!subject) return fail("Subject not found or not in one of your classes")

        let query = createAdminClient()
          .from("questions")
          .select(
            "id, question_text, explanation, difficulty, lesson_id, created_at, answer_options(option_text, is_correct, position)",
            { count: "exact" }
          )
          .eq("subject_id", subject_id)
        if (lesson_id) query = query.eq("lesson_id", lesson_id)

        const { data: questions, count, error } = await query
          .order("created_at")
          .range(offset, offset + limit - 1)
        if (error) return fail(error.message)

        return ok({
          subject: { id: subject.id, name: subject.name },
          total: count ?? 0,
          offset,
          questions: (questions ?? []).map(({ answer_options, ...q }) => ({
            ...q,
            options: [...(answer_options ?? [])]
              .sort((a, b) => a.position - b.position)
              .map((o) => ({ option_text: o.option_text, is_correct: o.is_correct })),
          })),
        })
      }
    )

    server.registerTool(
      "list_lessons",
      {
        title: "List lessons in a subject",
        description:
          "List the lessons of a subject (matière). Lessons group a subject's questions, e.g. by the course, document or chat they came from. Includes each lesson's question count.",
        inputSchema: z.object({ subject_id: z.string().uuid() }),
      },
      async ({ subject_id }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        if (!(await getOwnedSubject(tutorId, subject_id))) {
          return fail("Subject not found or not in one of your classes")
        }

        const supabase = createAdminClient()
        const [{ data: lessons, error }, { data: questions }] = await Promise.all([
          supabase.from("lessons").select("id, name, description, position").eq("subject_id", subject_id).order("position"),
          supabase.from("questions").select("lesson_id").eq("subject_id", subject_id),
        ])
        if (error) return fail(error.message)

        const countMap: Record<string, number> = {}
        for (const q of questions ?? []) {
          const key = q.lesson_id ?? "none"
          countMap[key] = (countMap[key] ?? 0) + 1
        }

        return ok({
          lessons: (lessons ?? []).map((l) => ({ ...l, question_count: countMap[l.id] ?? 0 })),
          questions_without_lesson: countMap.none ?? 0,
        })
      }
    )

    server.registerTool(
      "create_lesson",
      {
        title: "Create a lesson in a subject",
        description:
          "Create a lesson inside a subject (matière) to group related questions, e.g. one per course, document or chat they came from. Put the source in the name or description. Returns the lesson id to pass to add_questions.",
        inputSchema: z.object({
          subject_id: z.string().uuid(),
          name: z.string().min(1),
          description: z.string().optional(),
        }),
      },
      async ({ subject_id, name, description }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        if (!(await getOwnedSubject(tutorId, subject_id))) {
          return fail("Subject not found or not in one of your classes")
        }

        const supabase = createAdminClient()
        const { data: last } = await supabase
          .from("lessons")
          .select("position")
          .eq("subject_id", subject_id)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data, error } = await supabase
          .from("lessons")
          .insert({
            subject_id,
            name: name.trim(),
            description: description?.trim() || null,
            position: (last?.position ?? -1) + 1,
          })
          .select("id, name, subject_id")
          .single()
        if (error) return fail(error.message)
        return ok(data)
      }
    )

    server.registerTool(
      "set_class_cover",
      {
        title: "Set a class cover image",
        description:
          "Set the cover picture of one of the tutor's classes from a public https image URL (PNG, JPEG, WebP or GIF, max 5 MB). The image is copied into the app's storage. Pass image_url null to remove the cover.",
        inputSchema: z.object({
          class_id: z.string().uuid(),
          image_url: z.string().url().nullable(),
        }),
      },
      async ({ class_id, image_url }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        if (!(await tutorOwnsClass(tutorId, class_id))) return fail("Class not found or not yours")
        return setStoredImage({ table: "classes", column: "cover_url", folder: "classes" }, class_id, image_url)
      }
    )

    server.registerTool(
      "set_subject_logo",
      {
        title: "Set a subject logo",
        description:
          "Set the logo of a subject (matière) in one of the tutor's classes from a public https image URL (PNG, JPEG, WebP or GIF, max 5 MB). The image is copied into the app's storage. Pass image_url null to remove the logo.",
        inputSchema: z.object({
          subject_id: z.string().uuid(),
          image_url: z.string().url().nullable(),
        }),
      },
      async ({ subject_id, image_url }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        if (!(await getOwnedSubject(tutorId, subject_id))) {
          return fail("Subject not found or not in one of your classes")
        }
        return setStoredImage({ table: "subjects", column: "logo_url", folder: "subjects" }, subject_id, image_url)
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
          "Add multiple-choice questions to a subject in one of the tutor's classes, optionally inside one of its lessons (e.g. the course, document or chat the questions came from). Each question needs at least 2 options and at least one correct option; several options may be correct.",
        inputSchema: z.object({
          subject_id: z.string().uuid(),
          lesson_id: z.string().uuid().optional().describe("Lesson of this subject to put the questions in"),
          questions: z.array(questionSchema).min(1).max(50),
        }),
      },
      async ({ subject_id, lesson_id, questions }, ctx) => {
        const tutorId = getTutorId(ctx.http?.authInfo)
        const supabase = createAdminClient()

        if (!(await getOwnedSubject(tutorId, subject_id))) {
          return fail("Subject not found or not in one of your classes")
        }
        if (lesson_id && !(await lessonInSubject(lesson_id, subject_id))) {
          return fail("Lesson not found in this subject; nothing was added")
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
              lesson_id: lesson_id ?? null,
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
