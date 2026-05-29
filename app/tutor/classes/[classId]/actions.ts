"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

export async function updateClassDetails(classId: string, name: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const trimmedName = name.trim()
  if (!trimmedName) return { error: "Le nom est requis" }

  const { error } = await supabase
    .from("classes")
    .update({ name: trimmedName, description: description.trim() || null })
    .eq("id", classId)
    .eq("tutor_id", user.id)

  if (error) return { error: error.message }
  revalidatePath(`/tutor/classes/${classId}`)
  return { success: true }
}

export async function rotateInviteCode(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const newCode = crypto.randomUUID().replace(/-/g, "").slice(0, 8)

  const { error } = await supabase
    .from("classes")
    .update({ invite_code: newCode })
    .eq("id", classId)
    .eq("tutor_id", user.id)

  if (error) return { error: error.message }
  revalidatePath(`/tutor/classes/${classId}`)
  return { success: true, code: newCode }
}

export async function approveStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("class_memberships")
    .update({ status: "approved" })
    .eq("class_id", classId)
    .eq("student_id", studentId)
  if (error) return { error: error.message }

  const { data: cls } = await supabase.from("classes").select("name").eq("id", classId).single()
  await createNotification({
    userId: studentId,
    type: "class_join_approved",
    title: "Demande acceptée",
    body: `Vous avez été accepté dans la classe "${cls?.name ?? ""}".`,
    link: "/dashboard",
  })

  revalidatePath(`/tutor/classes/${classId}/students`)
  return { success: true }
}

export async function removeStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("class_memberships")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId)
  if (error) return { error: error.message }
  revalidatePath(`/tutor/classes/${classId}/students`)
  return { success: true }
}
