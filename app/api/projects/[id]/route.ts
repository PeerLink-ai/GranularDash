import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureProjectsSchema } from "@/lib/projects-schema"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await ensureProjectsSchema()
  const rows = await sql`SELECT * FROM projects WHERE id = ${params.id} LIMIT 1`
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ project: rows[0] })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await ensureProjectsSchema()
  const body = await req.json().catch(() => ({}))
  const fields = {
    name: body.name,
    description: body.description,
    pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
    metadata: body.metadata,
  }
  const existing = await sql`SELECT * FROM projects WHERE id = ${params.id} LIMIT 1`
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const mergedMeta = JSON.stringify({
    ...(existing[0].metadata || {}),
    ...(fields.metadata || {}),
  })
  const row = await sql`
    UPDATE projects
    SET
      name = COALESCE(${fields.name}, name),
      description = COALESCE(${fields.description}, description),
      pinned = COALESCE(${fields.pinned}, pinned),
      metadata = ${mergedMeta}::jsonb,
      updated_at = now()
    WHERE id = ${params.id}
    RETURNING *
  `
  return NextResponse.json({ project: row[0] })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await ensureProjectsSchema()
  await sql`DELETE FROM project_policies WHERE project_id = ${params.id}`
  await sql`DELETE FROM projects WHERE id = ${params.id}`
  return NextResponse.json({ success: true })
}
