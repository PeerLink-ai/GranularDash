import { type NextRequest, NextResponse } from "next/server"

const OAUTH_CONFIGS = {
  openai: {
    authUrl: "https://platform.openai.com/oauth/authorize",
    clientId: "demo_openai_client_id",
    scope: "api.read api.write",
  },
  anthropic: {
    authUrl: "https://console.anthropic.com/oauth/authorize",
    clientId: "demo_anthropic_client_id",
    scope: "api.read api.write",
  },
  replit: {
    authUrl: "https://replit.com/oauth/authorize",
    clientId: "demo_replit_client_id",
    scope: "agent.read agent.write",
  },
  groq: {
    authUrl: "https://console.groq.com/oauth/authorize",
    clientId: "demo_groq_client_id",
    scope: "api.read api.write",
  },
}

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params

  if (!OAUTH_CONFIGS[provider]) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
  }

  const config = OAUTH_CONFIGS[provider]
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/oauth/${provider}/callback`
  const state = Math.random().toString(36).substring(7)

  // In a real implementation, you would:
  // 1. Store the state in a secure session/database
  // 2. Use actual OAuth client IDs from environment variables
  // 3. Handle PKCE for security

  const authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}&response_type=code`

  return NextResponse.json({ authUrl })
}
