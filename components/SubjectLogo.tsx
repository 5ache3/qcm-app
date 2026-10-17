import { cn, seededGradient } from "@/lib/utils"

interface Props {
  name: string
  logoUrl: string | null
  icon: string | null
  className?: string
}

// Logo image if set, otherwise the emoji, otherwise the first letter, on a gradient tile
export function SubjectLogo({ name, logoUrl, icon, className }: Props) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={cn("h-11 w-11 shrink-0 rounded-xl object-cover shadow-soft", className)} />
    )
  }
  return (
    <div
      className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-soft", className)}
      style={{ backgroundImage: seededGradient(name) }}
    >
      {icon ?? name.charAt(0).toUpperCase()}
    </div>
  )
}
