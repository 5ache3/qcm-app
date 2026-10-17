import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Stable, pleasant gradient derived from a name, used when a class or subject has no image
export function seededGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  // Golden-angle spread so names differing by one character still get distinct hues
  const hue = Math.round(Math.abs(hash) * 137.508) % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 72% 52%))`
}
