import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rules = await sql`
      SELECT * FROM access_rules 
      WHERE organization = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ rules: rules || [] })
  } catch (error) {
    console.error("Failed to fetch access rules:", error)
    return NextResponse.json({ rules: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, resource_type, permissions, conditions, status } = await request.json()

    const [rule] = await sql`
      INSERT INTO access_rules (
        user_id, organization, name, description, resource_type, 
        permissions, conditions, status, created_at, updated_at
      ) VALUES (
        ${user.id}, ${user.organization}, ${name}, ${description}, ${resource_type},
        ${JSON.stringify(permissions)}, ${JSON.stringify(conditions)}, ${status || "active"},
        NOW(), NOW()
      ) RETURNING *
    `

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Failed to create access rule:", error)
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 })
  }
}
