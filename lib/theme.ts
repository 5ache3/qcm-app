export type Theme = "paper" | "cahier"

export const THEME_COOKIE = "qcm_theme"

export function getTheme(value: string | undefined): Theme {
  return value === "cahier" ? "cahier" : "paper"
}
