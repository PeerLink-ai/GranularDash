import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { addAIThoughtLog, listAIThoughtLogs } from "@/lib/ai-thought-audit"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId") || undefined
    const sessionId = searchParams.get("sessionId") || undefined
    const thoughtType = searchParams.get("thoughtType") || undefined
    const limit = Number(searchParams.get("limit") || 50)
    const offset = Number(searchParams.get("offset") || 0)

    const logs = await listAIThoughtLogs({
      agentId,
      sessionId,
      thoughtType,
      limit,
      offset,
    })

    return NextResponse.json({ logs })
  } catch (err) {
    console.error("GET /api/ai-thought-logs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    if (!body?.agentId || !body?.thoughtType || !body?.thoughtContent) {
      return NextResponse.json(
        {
          error: "Missing required fields: agentId, thoughtType, thoughtContent",
        },
        { status: 400 },
      )
    }

    const log = await addAIThoughtLog({
      agentId: body.agentId,
      sessionId: body.sessionId,
      thoughtType: body.thoughtType,
      prompt: body.prompt,
      thoughtContent: body.thoughtContent,
      contextData: body.contextData,
      confidenceScore: body.confidenceScore,
      reasoningSteps: body.reasoningSteps,
      decisionFactors: body.decisionFactors,
      alternativesConsidered: body.alternativesConsidered,
      outcomePrediction: body.outcomePrediction,
      processingTimeMs: body.processingTimeMs,
      modelUsed: body.modelUsed,
      temperature: body.temperature,
      tokensUsed: body.tokensUsed,
    })

    return NextResponse.json({ log })
  } catch (err) {
    console.error("POST /api/ai-thought-logs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
