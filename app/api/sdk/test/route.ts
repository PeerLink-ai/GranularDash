import { type NextRequest, NextResponse } from "next/server"
import { generateDemoLogs } from "@/lib/sdk-log-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const scenario = body.scenario || "normal"

    if (!["normal", "anomaly", "breach"].includes(scenario)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid scenario. Must be 'normal', 'anomaly', or 'breach'",
        },
        { status: 400 },
      )
    }

    await generateDemoLogs(scenario as "normal" | "anomaly" | "breach")

    return NextResponse.json({
      success: true,
      message: `Generated demo logs for ${scenario} scenario`,
      scenario,
    })
  } catch (error: any) {
    console.error("POST /api/sdk/test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate demo logs",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
