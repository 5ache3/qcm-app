"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getLessonsForSubject(subjectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select("id, name, description, position")
    .eq("subject_id", subjectId)
    .order("position")
  return data ?? []
}

export async function createLesson(subjectId: string, fields: { name: string; description?: string }) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("lessons")
    .select("position")
    .eq("subject_id", subjectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (existing?.position ?? -1) + 1
  const { error } = await supabase
    .from("lessons")
    .insert({ subject_id: subjectId, name: fields.name, description: fields.description || null, position })
  if (error) return { error: error.message }
  revalidatePath("/admin/subjects")
  return { success: true }
}

export async function updateLesson(
  lessonId: string,
  fields: { name: string; description?: string }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("lessons")
    .update({ name: fields.name, description: fields.description || null })
    .eq("id", lessonId)
  if (error) return { error: error.message }
  revalidatePath("/admin/subjects")
  return { success: true }
}

export async function deleteLesson(lessonId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId)
  if (error) return { error: error.message }
  revalidatePath("/admin/subjects")
  return { success: true }
}
