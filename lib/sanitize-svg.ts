import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"

export const MAX_SVG_BYTES = 512 * 1024

const purify = createDOMPurify(new JSDOM("").window)

// Keep only same-document references (e.g. href="#gradient"), so an SVG opened
// directly can't pull in external images or documents
purify.addHook("afterSanitizeAttributes", (node) => {
  for (const attr of ["href", "xlink:href"]) {
    const value = node.getAttribute(attr)
    if (value !== null && !value.trim().startsWith("#")) node.removeAttribute(attr)
  }
})

// Storage serves files without a CSP, so an SVG opened directly in a browser
// could run scripts. Every SVG is cleaned here before it is stored: scripts,
// event handlers, foreignObject and non-local references are removed.
export function sanitizeSvg(markup: string): { svg: string } | { error: string } {
  if (Buffer.byteLength(markup, "utf8") > MAX_SVG_BYTES) return { error: "SVG is larger than 512 KB" }

  const clean = purify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script"],
  })

  if (!/^\s*<svg[\s>]/i.test(clean)) return { error: "Not a valid SVG image" }
  return { svg: clean }
}
