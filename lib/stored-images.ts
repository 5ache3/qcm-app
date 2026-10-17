import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeSvg } from "@/lib/sanitize-svg"

// Server-side image storage for class covers and subject logos. Raster images
// go to qcm-images (browsers may also upload there, see ImageUploadButton).
// SVGs go to qcm-svg, which has no insert policy: only this server code, after
// sanitizing, can write to it.

export const IMAGE_BUCKET = "qcm-images"
export const SVG_BUCKET = "qcm-svg"
const MAX_RASTER_BYTES = 5 * 1024 * 1024
const RASTER_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
}
const SVG_TYPE = "image/svg+xml"

export const IMAGE_TARGETS = {
  "class-cover": { table: "classes", column: "cover_url", folder: "classes" },
  "subject-logo": { table: "subjects", column: "logo_url", folder: "subjects" },
} as const
export type ImageTarget = keyof typeof IMAGE_TARGETS

export type ImageInput = { contentType: string; bytes: ArrayBuffer }
type Failure = { error: string }

type Prepared = { body: ArrayBuffer | string; contentType: string; ext: string; bucket: string }

function prepare(input: ImageInput): Prepared | Failure {
  if (input.contentType === SVG_TYPE) {
    const result = sanitizeSvg(new TextDecoder().decode(input.bytes))
    if ("error" in result) return result
    return { body: result.svg, contentType: SVG_TYPE, ext: "svg", bucket: SVG_BUCKET }
  }
  const ext = RASTER_TYPES[input.contentType]
  if (!ext) return { error: "Unsupported image type; use PNG, JPEG, WebP, GIF or SVG" }
  if (input.bytes.byteLength > MAX_RASTER_BYTES) return { error: "Image is larger than 5 MB" }
  return { body: input.bytes, contentType: input.contentType, ext, bucket: IMAGE_BUCKET }
}

// Bucket and object path of a public URL from one of our buckets
export function storedObject(url: string | null) {
  for (const bucket of [IMAGE_BUCKET, SVG_BUCKET]) {
    const marker = `/object/public/${bucket}/`
    const i = url?.indexOf(marker) ?? -1
    if (url && i !== -1) return { bucket, path: decodeURIComponent(url.slice(i + marker.length)) }
  }
  return null
}

// Stores the image under <folder>/<ownerId>/ and saves its public URL on the
// row; null clears it. The previous file is removed from storage either way.
// Callers must check that the user may manage ownerId first.
export async function setStoredImage(
  target: ImageTarget,
  ownerId: string,
  input: ImageInput | null
): Promise<{ url: string | null } | Failure> {
  const { table, column, folder } = IMAGE_TARGETS[target]
  const supabase = createAdminClient()
  const { data: row } = await supabase.from(table).select(column).eq("id", ownerId).single()
  const previousUrl = (row as Record<string, string | null> | null)?.[column] ?? null

  let newUrl: string | null = null
  if (input) {
    const prepared = prepare(input)
    if ("error" in prepared) return prepared
    const path = `${folder}/${ownerId}/${Date.now()}.${prepared.ext}`
    const { error } = await supabase.storage
      .from(prepared.bucket)
      .upload(path, prepared.body, { contentType: prepared.contentType })
    if (error) return { error: error.message }
    newUrl = supabase.storage.from(prepared.bucket).getPublicUrl(path).data.publicUrl
  }

  const { error } = await supabase.from(table).update({ [column]: newUrl }).eq("id", ownerId)
  if (error) return { error: error.message }

  const previous = storedObject(previousUrl)
  if (previous) await supabase.storage.from(previous.bucket).remove([previous.path])
  return { url: newUrl }
}

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

// Downloads an image from a public https URL, following redirects by hand so
// every hop gets the same check
export async function fetchPublicImage(imageUrl: string): Promise<ImageInput | Failure> {
  let res: Response | null = null
  let nextUrl = imageUrl
  try {
    for (let hop = 0; hop < 4; hop++) {
      if (!isPublicHttpsUrl(nextUrl)) return { error: "image_url must be a public https URL" }
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
    return { error: "Could not download the image" }
  }
  if (!res) return { error: "Too many redirects" }
  if (!res.ok) return { error: `Could not download the image (HTTP ${res.status})` }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
  const bytes = await res.arrayBuffer()
  if (bytes.byteLength > MAX_RASTER_BYTES) return { error: "Image is larger than 5 MB" }
  return { contentType, bytes }
}
