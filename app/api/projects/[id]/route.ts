import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await tableExists("projects"))) {
      return NextResponse.json({ project: null }, { status: 404 })
    }
    const rows = await neonSql`
      SELECT
        id::text AS id,
        name,
        description,
        type,
        repo_url,
        metadata,
        pinned,
        created_at,
        updated_at
      FROM projects
      WHERE id = ${params.id}::uuid
      LIMIT 1
    `
    if (!rows?.length) return NextResponse.json({ project: null }, { status: 404 })
    return NextResponse.json({ project: rows[0] })
  } catch (e) {
    console.error("Get project error:", e)
    return NextResponse.json({ project: null }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await tableExists("projects"))) return NextResponse.json({ success: false }, { status: 404 })
    const body = await req.json()
    const { name, description, type, repo_url, metadata, pinned } = body
    await query(
      `
      UPDATE projects SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        repo_url = COALESCE($5, repo_url),
        metadata = COALESCE($6, metadata),
        pinned = COALESCE($7, pinned),
        updated_at = NOW()
      WHERE id = $1::uuid
    `,
      [params.id, name, description, type, repo_url, metadata, pinned],
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Update project error:", e)
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await tableExists("projects"))) return NextResponse.json({ success: true })
    await query(`DELETE FROM projects WHERE id = $1::uuid`, [params.id])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Delete project error:", e)
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 })
  }
}
