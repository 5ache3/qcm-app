"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { uploadSvgImage } from "@/app/actions/images"

const BUCKET = "qcm-images"
const BUCKETS = [BUCKET, "qcm-svg"]
const MAX_BYTES = 5 * 1024 * 1024
const MAX_SVG_BYTES = 512 * 1024

interface Props {
  target: "class-cover" | "subject-logo"
  ownerId: string
  currentUrl: string | null
  // "overlay" sits on top of an image; "plain" sits inside a regular card
  variant?: "overlay" | "plain"
  className?: string
}

const TARGETS = {
  "class-cover": { table: "classes", column: "cover_url", folder: "classes", label: "Couverture" },
  "subject-logo": { table: "subjects", column: "logo_url", folder: "subjects", label: "Logo" },
} as const

// Bucket and path of a public URL from our buckets, so the old file can be removed
function storedObject(url: string | null) {
  for (const bucket of BUCKETS) {
    const marker = `/object/public/${bucket}/`
    const i = url?.indexOf(marker) ?? -1
    if (url && i !== -1) return { bucket, path: decodeURIComponent(url.slice(i + marker.length)) }
  }
  return null
}

// Uploads go straight from the browser to Supabase Storage; the qcm-images
// policies only allow paths under classes/subjects the user manages.
export function ImageUploadButton({ target, ownerId, currentUrl, variant = "overlay", className }: Props) {
  const buttonStyle =
    variant === "overlay"
      ? "bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  const { table, column, folder, label } = TARGETS[target]
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function setUrl(url: string | null) {
    const supabase = createClient()
    const { error } = await supabase.from(table).update({ [column]: url }).eq("id", ownerId)
    if (error) throw error
    const old = storedObject(currentUrl)
    if (old) await supabase.storage.from(old.bucket).remove([old.path])
  }

  async function handleFile(file: File) {
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
    if (!isSvg && !file.type.startsWith("image/")) {
      toast.error("Choisissez une image PNG, JPEG, WebP, GIF ou SVG")
      return
    }
    if (file.size > (isSvg ? MAX_SVG_BYTES : MAX_BYTES)) {
      toast.error(isSvg ? "SVG trop lourd (512 Ko max)" : "Image trop lourde (5 Mo max)")
      return
    }
    setBusy(true)
    try {
      if (isSvg) {
        // SVGs are sanitized and stored by the server
        const formData = new FormData()
        formData.append("file", file)
        const res = await uploadSvgImage(target, ownerId, formData)
        if ("error" in res) throw new Error(res.error)
        toast.success(`${label} mis${target === "class-cover" ? "e" : ""} à jour`)
        router.refresh()
        return
      }
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase() || "png"
      const path = `${folder}/${ownerId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
      if (error) throw error
      await setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
      toast.success(`${label} mis${target === "class-cover" ? "e" : ""} à jour`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    setBusy(true)
    try {
      await setUrl(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la suppression")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) handleFile(file)
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-60", buttonStyle)}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        {label}
      </button>
      {currentUrl && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          title="Retirer l'image"
          className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors", buttonStyle)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
