import { type NextRequest, NextResponse } from "next/server"
import { getQuizById } from "@/lib/assessment-system"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = getQuizById(params.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get quiz",
      },
      { status: 500 },
    )
  }
}
