import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`
      SELECT u.id, u.email, u.organization 
      FROM users u
      JOIN user_sessions s ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      LIMIT 1
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    const categories = await sql`
      SELECT 
        id,
        name,
        description,
        color,
        created_at
      FROM training_categories 
      WHERE organization_id = ${user.organization}
      ORDER BY name ASC
    `

    return NextResponse.json({
      success: true,
      categories: categories || [],
    })
  } catch (error) {
    console.error("Training categories error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 },
    )
  }
}
