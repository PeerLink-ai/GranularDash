import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureProjectsSchema } from "@/lib/projects-schema"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureProjectsSchema()
    const id = params.id
    const body = await req.json().catch(() => ({}))

    const allowed: Record<string, any> = {}
    if ("name" in body) allowed.name = body.name
    if ("description" in body) allowed.description = body.description
    if ("type" in body) allowed.type = body.type
    if ("repo_url" in body) allowed.repo_url = body.repo_url
    if ("metadata" in body) allowed.metadata = body.metadata
    if ("pinned" in body) allowed.pinned = Boolean(body.pinned)

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }

    // Build dynamic SET clause safely
    const sets: string[] = []
    const paramsArr: any[] = []
    let idx = 1

    for (const [key, value] of Object.entries(allowed)) {
      if (key === "metadata") {
        sets.push(`metadata = $${idx}::jsonb`)
        paramsArr.push(JSON.stringify(value ?? {}))
      } else {
        sets.push(`${key} = $${idx}`)
        paramsArr.push(value)
      }
      idx++
    }
    // updated_at
    sets.push(`updated_at = now()`)

    const text = `
      UPDATE projects
      SET ${sets.join(", ")}
      WHERE id = $${idx}
      RETURNING id, name, description, type, repo_url, metadata, pinned, created_at, updated_at;
    `
    paramsArr.push(id)

    const result = await sql.query(text, paramsArr)
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ project: result[0] }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureProjectsSchema()
    const id = params.id
    const deleted = await sql`
      DELETE FROM projects WHERE id = ${id} RETURNING id;
    `
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
