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

    const simulations = await sql`
      SELECT 
        id,
        name,
        type,
        status,
        last_run,
        score,
        description,
        created_at
      FROM training_simulations 
      WHERE organization_id = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ 
      success: true,
      simulations: simulations || [] 
    })
  } catch (error) {
    console.error("Training simulations error:", error)
    return NextResponse.json({ 
      success: false,
      simulations: [] 
    })
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
    const { name, type, description } = body

    const result = await sql`
      INSERT INTO training_simulations (
        organization_id, 
        name, 
        type, 
        description, 
        status,
        created_at
      ) VALUES (
        ${user.organization},
        ${name},
        ${type},
        ${description},
        'scheduled',
        NOW()
      )
      RETURNING id, name, type, status, created_at
    `

    return NextResponse.json({ 
      success: true,
      simulation: result[0] 
    })
  } catch (error) {
    console.error("Create training simulation error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to create simulation" 
    }, { status: 500 })
  }
}
