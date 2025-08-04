import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rule = await sql`
      SELECT * FROM access_rules 
      WHERE id = ${params.id} AND organization = ${user.organization}
    `

    if (rule.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule: rule[0] })
  } catch (error) {
    console.error("Error fetching access rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!name || !resource || !role || !permission) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const rule = await sql`
      UPDATE access_rules 
      SET name = ${name}, resource = ${resource}, role = ${role}, permission = ${permission}, 
          status = ${status}, description = ${description}
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING *
    `

    if (rule.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule: rule[0] })
  } catch (error) {
    console.error("Error updating access rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      DELETE FROM access_rules 
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting access rule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
