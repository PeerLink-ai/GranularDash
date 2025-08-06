import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get specific policy
    const policyResult = await sql`
      SELECT * FROM policies 
      WHERE id = ${params.id} AND organization = ${user.organization}
    `

    if (policyResult.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy: policyResult[0] })
  } catch (error) {
    console.error("Failed to fetch policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { name, description, type, severity, status, rules } = body

    // Update policy
    const result = await sql`
      UPDATE policies 
      SET 
        name = ${name},
        description = ${description},
        type = ${type},
        severity = ${severity},
        status = ${status},
        rules = ${JSON.stringify(rules || {})},
        updated_at = NOW()
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy: result[0] })
  } catch (error) {
    console.error("Failed to update policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Delete policy
    const result = await sql`
      DELETE FROM policies 
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete policy:", error)
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 })
  }
}
