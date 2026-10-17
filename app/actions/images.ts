"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { setStoredImage, type ImageTarget } from "@/lib/stored-images"

async function canManage(userId: string, target: ImageTarget, ownerId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).single()
  if (profile?.role === "admin") return true

  if (target === "class-cover") {
    const { data } = await admin.from("classes").select("id").eq("id", ownerId).eq("tutor_id", userId).maybeSingle()
    return !!data
  }
  const { data: subject } = await admin.from("subjects").select("class_id").eq("id", ownerId).maybeSingle()
  if (!subject?.class_id) return false
  const { data } = await admin.from("classes").select("id").eq("id", subject.class_id).eq("tutor_id", userId).maybeSingle()
  return !!data
}

// SVG uploads go through the server so they can be sanitized before storage
export async function uploadSvgImage(target: ImageTarget, ownerId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Fichier manquant" }
  if (!(await canManage(user.id, target, ownerId))) return { error: "Non autorisé" }

  return setStoredImage(target, ownerId, { contentType: "image/svg+xml", bytes: await file.arrayBuffer() })
}
