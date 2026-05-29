"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const name = (formData.get("name") as string).trim()
  const description = (formData.get("description") as string).trim() || null
  if (!name) return { error: "Le nom est requis" }

  const { data, error } = await supabase
    .from("classes")
    .insert({ name, description, tutor_id: user.id })
    .select("id, invite_code")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/tutor")
  return { success: true, id: data.id, invite_code: data.invite_code }
}

export async function deleteClass(classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("classes").delete().eq("id", classId)
  if (error) return { error: error.message }
  revalidatePath("/tutor")
  return { success: true }
}
