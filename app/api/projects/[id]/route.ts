import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()
    const fields: string[] = []
    const values: any[] = []

    // Only allow known fields
    const updatable = ["name", "description", "pinned", "repo_url", "metadata", "type"] as const
    let idx = 1
    let setClauses: any[] = []

    for (const key of updatable) {
      if (key in body) {
        // @ts-ignore
        setClauses.push(sql`${sql.raw(key)} = ${body[key]}`)
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }

    await sql`update projects set ${sql.join(setClauses, sql`, `)} where id = ${id}`
    const [project] = await sql<any[]>`select * from projects where id = ${id}`
    return NextResponse.json({ project }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await sql`delete from projects where id = ${id}`
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete project" }, { status: 500 })
  }
}
