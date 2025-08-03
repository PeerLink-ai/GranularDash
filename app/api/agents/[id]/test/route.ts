import { type NextRequest, NextResponse } from "next/server"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

// In-memory store for agents, keyed by user ID (same as in /api/agents/route.ts)
const userAgents = new Map<string, Agent[]>()

const MOCK_RESPONSES = {
  openai:
    "Hello! I'm an OpenAI model. I can help you with a wide variety of tasks including writing, analysis, coding, and creative projects. How can I assist you today?",
  anthropic:
    "Hi there! I'm an Anthropic model. I'm designed to be helpful, harmless, and honest. I can assist with analysis, writing, math, coding, creative tasks, and much more. What would you like to work on?",
  groq: "Greetings! I'm a Groq-powered model. I can provide quick responses for various tasks including conversation, analysis, and problem-solving. What can I help you with?",
  replit:
    "Hello from Replit! I'm a coding assistant. I can help you with code generation, debugging, and understanding programming concepts. How can I assist with your code today?",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const userId = request.headers.get("X-User-ID")

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agents = userAgents.get(userId) || []
  const agent = agents.find((a) => a.id === id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const { prompt } = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 200))

  // Simulate occasional errors for testing
  if (Math.random() < 0.05) {
    // 5% chance of error
    return NextResponse.json(
      { error: "Agent temporarily unavailable or encountered an internal error." },
      { status: 500 },
    )
  }

  // Get mock response based on provider
  const response =
    MOCK_RESPONSES[agent.provider.toLowerCase() as keyof typeof MOCK_RESPONSES] ||
    `This is a test response from agent ${agent.name} to your prompt: "${prompt}"`

  // Update agent usage metrics
  agent.usage.requests += 1
  agent.usage.tokensUsed += Math.floor(prompt.length * 0.5) + Math.floor(response.length * 0.8) // Simulate token usage
  agent.usage.estimatedCost += Math.random() * 0.01 + 0.001 // Simulate small cost per request
  agent.lastActive = "Just now" // Update last active time

  userAgents.set(userId, agents) // Save updated agents list

  return NextResponse.json({ response })
}
