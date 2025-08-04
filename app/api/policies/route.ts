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

    const policies = await sql`
      SELECT * FROM policies 
      WHERE organization = ${organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ policies })
  } catch (error) {
    console.error("Error fetching policies:", error)
    return NextResponse.json({ policies: [] })
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

    const { name, category, version, description, status } = await request.json()

    const policy = await sql`
      INSERT INTO policies (user_id, organization, name, category, version, description, status)
      VALUES (${user.id}, ${user.organization}, ${name}, ${category}, ${version}, ${description || null}, ${status})
      RETURNING *
    `

    return NextResponse.json({ policy: policy[0] })
  } catch (error) {
    console.error("Error creating policy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
