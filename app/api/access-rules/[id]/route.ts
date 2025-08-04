import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, resource_type, permissions, conditions, status } = await request.json()

    const [rule] = await sql`
      UPDATE access_rules 
      SET name = ${name}, description = ${description}, resource_type = ${resource_type},
          permissions = ${JSON.stringify(permissions)}, conditions = ${JSON.stringify(conditions)},
          status = ${status}, updated_at = NOW()
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING *
    `

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Failed to update access rule:", error)
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM access_rules 
      WHERE id = ${params.id} AND organization = ${user.organization}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete access rule:", error)
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}
