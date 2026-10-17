import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler"

// RFC 9728 metadata for /api/mcp: tells OAuth clients (claude.ai) to sign in
// through Supabase Auth's OAuth server. The path suffix makes the advertised
// resource https://<host>/api/mcp.
const handler = protectedResourceHandler({
  authServerUrls: [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],
})

const optionsHandler = metadataCorsOptionsRequestHandler()

export { handler as GET, optionsHandler as OPTIONS }
