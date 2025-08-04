import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user session from cookie
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, organization_id FROM users WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]

    // Fetch specific policy
    const result = await sql`
      SELECT * FROM policies 
      WHERE id = ${params.id} AND organization_id = ${user.organization_id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user session from cookie
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, organization_id FROM users WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]
    const body = await request.json()

    const { name, type, description, rules, severity, status } = body

    // Update policy
    const result = await sql`
      UPDATE policies 
      SET name = ${name}, type = ${type}, description = ${description}, 
          rules = ${JSON.stringify(rules)}, severity = ${severity}, 
          status = ${status}, updated_at = NOW()
      WHERE id = ${params.id} AND organization_id = ${user.organization_id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user session from cookie
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, organization_id FROM users WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]

    // Delete policy
    const result = await sql`
      DELETE FROM policies 
      WHERE id = ${params.id} AND organization_id = ${user.organization_id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Policy deleted successfully" })
  } catch (error) {
    console.error("Error deleting policy:", error)
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 })
  }
}
