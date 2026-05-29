"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function verifyTutorOwnsClass(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("tutor_id", user.id)
    .single()
  return cls ? supabase : null
}

export async function createClassSubject(classId: string, formData: FormData) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

  const name = (formData.get("name") as string).trim()
  const description = (formData.get("description") as string).trim() || null
  const icon = (formData.get("icon") as string).trim() || null
  const due_date = (formData.get("due_date") as string).trim() || null
  if (!name) return { error: "Le nom est requis" }

  const { error } = await supabase
    .from("subjects")
    .insert({ name, description, icon, due_date, class_id: classId })
  if (error) return { error: error.message }

  revalidatePath(`/tutor/classes/${classId}/subjects`)
  return { success: true }
}

export async function updateClassSubjectDueDate(classId: string, subjectId: string, due_date: string | null) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase
    .from("subjects")
    .update({ due_date: due_date || null })
    .eq("id", subjectId)
    .eq("class_id", classId)
  if (error) return { error: error.message }

  revalidatePath(`/tutor/classes/${classId}/subjects`)
  return { success: true }
}

export async function deleteClassSubject(classId: string, subjectId: string) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId)
    .eq("class_id", classId)
  if (error) return { error: error.message }

  revalidatePath(`/tutor/classes/${classId}/subjects`)
  return { success: true }
}

// Lesson actions scoped to tutor's class subjects
export async function getTutorLessonsForSubject(subjectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select("id, name, description, position")
    .eq("subject_id", subjectId)
    .order("position")
  return data ?? []
}

export async function createTutorLesson(classId: string, subjectId: string, fields: { name: string; description?: string }) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

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
  return { success: true }
}

export async function updateTutorLesson(classId: string, lessonId: string, fields: { name: string; description?: string }) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase
    .from("lessons")
    .update({ name: fields.name, description: fields.description || null })
    .eq("id", lessonId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTutorLesson(classId: string, lessonId: string) {
  const supabase = await verifyTutorOwnsClass(classId)
  if (!supabase) return { error: "Non autorisé" }

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId)
  if (error) return { error: error.message }
  return { success: true }
}
