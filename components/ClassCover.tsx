import { cn, seededGradient } from "@/lib/utils"

interface Props {
  name: string
  coverUrl: string | null
  className?: string
  children?: React.ReactNode
}

export function ClassCover({ name, coverUrl, className, children }: Props) {
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={coverUrl ? undefined : { backgroundImage: seededGradient(name) }}
    >
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {children}
    </div>
  )
}
