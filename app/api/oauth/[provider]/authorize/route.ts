import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { randomBytes } from "crypto"

const OAUTH_CONFIGS = {
  openai: {
    authUrl: "https://platform.openai.com/oauth/authorize",
    clientId: process.env.OPENAI_CLIENT_ID || "demo_openai_client_id",
    scope: "api.read api.write",
    name: "OpenAI",
  },
  anthropic: {
    authUrl: "https://console.anthropic.com/oauth/authorize",
    clientId: process.env.ANTHROPIC_CLIENT_ID || "demo_anthropic_client_id",
    scope: "api.read api.write",
    name: "Anthropic",
  },
  groq: {
    authUrl: "https://console.groq.com/oauth/authorize",
    clientId: process.env.GROQ_CLIENT_ID || "demo_groq_client_id",
    scope: "api.read api.write",
    name: "Groq",
  },
  huggingface: {
    authUrl: "https://huggingface.co/oauth/authorize",
    clientId: process.env.HUGGINGFACE_CLIENT_ID || "demo_hf_client_id",
    scope: "read-repos write-repos",
    name: "Hugging Face",
  },
  cohere: {
    authUrl: "https://dashboard.cohere.ai/oauth/authorize",
    clientId: process.env.COHERE_CLIENT_ID || "demo_cohere_client_id",
    scope: "api.read api.write",
    name: "Cohere",
  },
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider } = params
    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS]

    if (!config) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
    }

    // Generate state parameter for security
    const state = randomBytes(32).toString("hex")
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/${provider}/callback`

    // Store state in session/database for verification
    // For demo purposes, we'll include user info in state
    const stateData = {
      userId: user.id,
      organization: user.organization,
      timestamp: Date.now(),
      random: state,
    }
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString("base64url")

    const authUrl = new URL(config.authUrl)
    authUrl.searchParams.set("client_id", config.clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("scope", config.scope)
    authUrl.searchParams.set("state", encodedState)
    authUrl.searchParams.set("response_type", "code")

    return NextResponse.json({
      authUrl: authUrl.toString(),
      provider: config.name,
    })
  } catch (error) {
    console.error("OAuth authorize error:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }
}
