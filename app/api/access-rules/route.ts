import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organization = searchParams.get("organization")

    if (!organization || organization !== user.organization) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rules = await sql`
      SELECT * FROM access_rules 
      WHERE organization = ${organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Error fetching access rules:", error)
    return NextResponse.json({ rules: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, resource, role, permission, status, description } = await request.json()

    const rule = await sql`
      INSERT INTO access_rules (user_id, organization, name, resource, role, permission, status, description)
      VALUES (${user.id}, ${user.organization}, ${name}, ${resource}, ${role}, ${permission}, ${status}, ${description || null})
      RETURNING *
    `

    return NextResponse.json({ rule: rule[0] })
  } catch (error) {
    console.error("Error creating access rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
