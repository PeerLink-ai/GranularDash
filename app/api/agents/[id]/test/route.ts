import { type NextRequest, NextResponse } from "next/server"

const MOCK_RESPONSES = {
  "openai-gpt4o-001":
    "Hello! I'm GPT-4o, OpenAI's most advanced model. I can help you with a wide variety of tasks including writing, analysis, coding, and creative projects. How can I assist you today?",
  "anthropic-claude3-001":
    "Hi there! I'm Claude 3 Opus, Anthropic's most capable AI assistant. I'm designed to be helpful, harmless, and honest. I can assist with analysis, writing, math, coding, creative tasks, and much more. What would you like to work on?",
  "groq-llama3-001":
    "Greetings! I'm Llama 3 70B running on Groq's ultra-fast inference infrastructure. I can provide quick responses for various tasks including conversation, analysis, and problem-solving. What can I help you with?",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { prompt } = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500))

  // Get mock response or generate a generic one
  const response = MOCK_RESPONSES[id] || `This is a test response from agent ${id} to your prompt: "${prompt}"`

  // Simulate occasional errors for testing
  if (Math.random() < 0.1) {
    return NextResponse.json({ error: "Agent temporarily unavailable" }, { status: 500 })
  }

  return NextResponse.json({ response })
}
