import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
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

    // Get search query
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Fetch policies for the user's organization
    let policies
    if (search) {
      policies = await sql`
        SELECT * FROM policies 
        WHERE organization_id = ${user.organization_id}
        AND (name ILIKE ${`%${search}%`} OR type ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
        ORDER BY created_at DESC
      `
    } else {
      policies = await sql`
        SELECT * FROM policies 
        WHERE organization_id = ${user.organization_id}
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json(policies)
  } catch (error) {
    console.error("Error fetching policies:", error)
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { name, type, description, rules, severity, status = "active" } = body

    if (!name || !type || !description || !rules) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new policy
    const result = await sql`
      INSERT INTO policies (name, type, description, rules, severity, status, organization_id, created_by)
      VALUES (${name}, ${type}, ${description}, ${JSON.stringify(rules)}, ${severity}, ${status}, ${user.organization_id}, ${user.id})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}
