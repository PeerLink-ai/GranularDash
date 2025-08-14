import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { ensureProjectsSchema } from "@/lib/projects-schema"

export async function GET() {
  try {
    await ensureProjectsSchema()
    const rows = await sql`SELECT * FROM projects ORDER BY pinned DESC, updated_at DESC`
    return NextResponse.json({ projects: rows })
  } catch (e: any) {
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(req: Request) {
  try {
    await ensureProjectsSchema()
    const body = await req.json()
    const id = body.id || crypto.randomUUID()
    const data = await sql`
      INSERT INTO projects (id, name, description, type, repo_url, metadata, pinned, created_at, updated_at)
      VALUES (${id}, ${body.name}, ${body.description ?? null}, ${body.type ?? "native"}, ${body.repo_url ?? null}, ${JSON.stringify(body.metadata ?? {})}::jsonb, ${Boolean(body.pinned)}, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        repo_url = EXCLUDED.repo_url,
        metadata = EXCLUDED.metadata,
        pinned = EXCLUDED.pinned,
        updated_at = now()
      RETURNING *
    `
    // Optionally attribute to user
    try {
      const cookieStore = await cookies()
      const session = cookieStore.get("session_token")?.value
      const user = await getUserBySession(session)
      if (user) {
        await sql`
          INSERT INTO audit_logs (user_id, organization, action, resource_type, resource_id, description, status, timestamp)
          VALUES (${user.id}, ${user.organization}, 'create_project', 'project', ${id}, ${"Created/updated project"}, 'info', now())
        `
      }
    } catch {}
    return NextResponse.json({ project: data[0] }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
