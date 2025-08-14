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

    const modules = await sql`
      SELECT 
        id,
        name,
        type,
        description,
        content,
        status,
        created_at,
        updated_at
      FROM training_modules 
      WHERE organization_id = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      modules: modules || [],
    })
  } catch (error) {
    console.error("Training modules error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch modules",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { name, type, description, content = {} } = body

    const result = await sql`
      INSERT INTO training_modules (
        organization_id, 
        name, 
        type, 
        description, 
        content,
        status,
        created_at
      ) VALUES (
        ${user.organization},
        ${name},
        ${type},
        ${description},
        ${JSON.stringify(content)},
        'active',
        NOW()
      )
      RETURNING id, name, type, description, status, created_at
    `

    return NextResponse.json({
      success: true,
      module: result[0],
    })
  } catch (error) {
    console.error("Create training module error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create module",
      },
      { status: 500 },
    )
  }
}
