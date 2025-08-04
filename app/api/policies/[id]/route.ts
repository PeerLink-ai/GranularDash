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

    const policy = await sql`
      SELECT * FROM policies 
      WHERE id = ${params.id} AND organization = ${user.organization}
    `

    if (policy.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy: policy[0] })
  } catch (error) {
    console.error("Error fetching policy:", error)
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

    const { name, category, version, description, status } = await request.json()

    if (!name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const policy = await sql`
      UPDATE policies 
      SET name = ${name}, category = ${category}, version = ${version}, 
          description = ${description}, status = ${status}
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING *
    `

    if (policy.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy: policy[0] })
  } catch (error) {
    console.error("Error updating policy:", error)
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
      DELETE FROM policies 
      WHERE id = ${params.id} AND organization = ${user.organization}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting policy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
