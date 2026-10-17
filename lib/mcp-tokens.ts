import { createHash, randomBytes } from "crypto"

export function generateMcpToken() {
  return `qcm_${randomBytes(32).toString("base64url")}`
}

export function hashMcpToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
