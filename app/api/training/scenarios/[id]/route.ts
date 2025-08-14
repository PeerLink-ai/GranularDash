import { type NextRequest, NextResponse } from "next/server"
import { getScenarioById } from "@/lib/training-scenarios"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const scenario = getScenarioById(params.id)

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      scenario,
    })
  } catch (error) {
    console.error("Get scenario error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get scenario",
      },
      { status: 500 },
    )
  }
}
