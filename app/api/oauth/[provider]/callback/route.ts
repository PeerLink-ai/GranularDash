import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

const OAUTH_CONFIGS = {
  openai: {
    tokenUrl: "https://api.openai.com/v1/oauth/token",
    apiUrl: "https://api.openai.com/v1",
    name: "OpenAI",
    defaultModel: "gpt-4",
  },
  anthropic: {
    tokenUrl: "https://api.anthropic.com/v1/oauth/token",
    apiUrl: "https://api.anthropic.com/v1",
    name: "Anthropic",
    defaultModel: "claude-3-sonnet-20240229",
  },
  groq: {
    tokenUrl: "https://api.groq.com/openai/v1/oauth/token",
    apiUrl: "https://api.groq.com/openai/v1",
    name: "Groq",
    defaultModel: "llama3-70b-8192",
  },
  huggingface: {
    tokenUrl: "https://huggingface.co/oauth/token",
    apiUrl: "https://api-inference.huggingface.co",
    name: "Hugging Face",
    defaultModel: "microsoft/DialoGPT-medium",
  },
  cohere: {
    tokenUrl: "https://api.cohere.ai/v1/oauth/token",
    apiUrl: "https://api.cohere.ai/v1",
    name: "Cohere",
    defaultModel: "command-r-plus",
  },
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    return new NextResponse(
      `
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc2626; }
            .button { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Connection Failed</h2>
            <p>The OAuth authorization was cancelled or failed.</p>
            <p>Error: ${error}</p>
            <a href="#" onclick="window.close()" class="button">Close Window</a>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ success: false, error: '${error}' }, '*');
              }
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  }

  if (!code || !state) {
    return new NextResponse(
      `
      <html>
        <head>
          <title>Invalid Request</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Invalid Request</h2>
            <p>Missing authorization code or state parameter.</p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ success: false, error: 'invalid_request' }, '*');
              }
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  }

  try {
    const { provider } = params
    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS]

    if (!config) {
      throw new Error("Unsupported provider")
    }

    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString())
    const { userId, organization } = stateData

    // In a real implementation, you would:
    // 1. Exchange the code for an access token
    // 2. Fetch user/agent information from the provider
    // 3. Store the connection securely

    // For demo purposes, simulate the OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create the agent connection
    const agentId = randomBytes(16).toString("hex")
    const agentName = `${organization} ${config.name} Agent`

    await sql`
      INSERT INTO connected_agents (
        id,
        user_id,
        agent_id,
        name,
        provider,
        model,
        status,
        endpoint,
        connected_at,
        last_active,
        usage_requests,
        usage_tokens_used,
        usage_estimated_cost,
        health_status,
        last_health_check
      ) VALUES (
        ${randomBytes(16).toString("hex")},
        ${userId},
        ${agentId},
        ${agentName},
        ${provider},
        ${config.defaultModel},
        'active',
        ${config.apiUrl},
        NOW(),
        NOW(),
        0,
        0,
        0.0,
        'healthy',
        NOW()
      )
    `

    return new NextResponse(
      `
      <html>
        <head>
          <title>Connection Successful</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #059669; }
            .agent-info { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: left; }
            .button { background: #059669; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="success">✅ Agent Connected Successfully!</h2>
            <div class="agent-info">
              <h3>${config.name} Agent</h3>
              <p><strong>Name:</strong> ${agentName}</p>
              <p><strong>Model:</strong> ${config.defaultModel}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Organization:</strong> ${organization}</p>
            </div>
            <p>Your agent is now connected and ready to use!</p>
            <a href="#" onclick="window.close()" class="button">Continue</a>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ 
                  success: true, 
                  provider: '${provider}',
                  agent: {
                    name: '${agentName}',
                    model: '${config.defaultModel}',
                    provider: '${provider}'
                  }
                }, '*');
              }
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  } catch (error) {
    console.error("OAuth callback error:", error)
    return new NextResponse(
      `
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Connection Failed</h2>
            <p>There was an error connecting your agent.</p>
            <p>Please try again or contact support if the problem persists.</p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ success: false, error: 'connection_failed' }, '*');
              }
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
