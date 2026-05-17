"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createSubject(formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get("name") as string).trim()
  const description = (formData.get("description") as string).trim() || null
  const icon = (formData.get("icon") as string).trim() || null
  const due_date = (formData.get("due_date") as string).trim() || null

  if (!name) return { error: "Name is required" }

  const { error } = await supabase.from("subjects").insert({ name, description, icon, due_date })
  if (error) return { error: error.message }

  revalidatePath("/admin/subjects")
  revalidatePath("/subjects")
  return { success: true }
}

export async function updateSubjectDueDate(subjectId: string, due_date: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("subjects")
    .update({ due_date: due_date || null })
    .eq("id", subjectId)
  if (error) return { error: error.message }

  revalidatePath("/admin/subjects")
  revalidatePath("/subjects")
  return { success: true }
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId)
  if (error) return { error: error.message }

  revalidatePath("/admin/subjects")
  revalidatePath("/subjects")
  return { success: true }
}
