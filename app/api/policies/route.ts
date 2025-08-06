import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    // Get policies for the user's organization
    const policies = await sql`
      SELECT 
        id,
        name,
        description,
        type,
        status,
        severity,
        created_at,
        updated_at
      FROM policies 
      WHERE organization = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ policies })
  } catch (error) {
    console.error("Failed to fetch policies:", error)
    return NextResponse.json({ policies: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]
    const body = await request.json()

    const { name, description, type, severity, rules } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Create new policy
    const result = await sql`
      INSERT INTO policies (
        name, 
        description, 
        type, 
        severity, 
        rules, 
        status, 
        organization,
        created_at,
        updated_at
      )
      VALUES (
        ${name},
        ${description || ""},
        ${type},
        ${severity || "medium"},
        ${JSON.stringify(rules || {})},
        'active',
        ${user.organization},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ policy: result[0] })
  } catch (error) {
    console.error("Failed to create policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}
