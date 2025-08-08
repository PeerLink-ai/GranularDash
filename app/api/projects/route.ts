import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureProjectsSchema } from "@/lib/projects-schema"

export async function GET() {
  try {
    await ensureProjectsSchema()
    const rows = await sql`
      SELECT id, name, description, type, repo_url, metadata, pinned, created_at, updated_at
      FROM projects
      ORDER BY pinned DESC, updated_at DESC
      LIMIT 200;
    `
    return NextResponse.json({ projects: rows }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureProjectsSchema()
    const body = await req.json().catch(() => ({}))

    let { id, name, description, type, repo_url, metadata, pinned } = body as {
      id?: string
      name?: string
      description?: string
      type?: "native" | "github" | "external"
      repo_url?: string
      metadata?: any
      pinned?: boolean
    }

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      )
    }

    // Normalize
    id = id || crypto.randomUUID()
    description = description || null
    repo_url = repo_url || null
    pinned = Boolean(pinned)
    const metadataStr = JSON.stringify(metadata ?? {})

    const inserted = await sql`
      INSERT INTO projects (id, name, description, type, repo_url, metadata, pinned, created_at, updated_at)
      VALUES (${id}, ${name}, ${description}, ${type}, ${repo_url}, ${metadataStr}::jsonb, ${pinned}, now(), now())
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            type = EXCLUDED.type,
            repo_url = EXCLUDED.repo_url,
            metadata = EXCLUDED.metadata,
            pinned = EXCLUDED.pinned,
            updated_at = now()
      RETURNING id, name, description, type, repo_url, metadata, pinned, created_at, updated_at;
    `

    return NextResponse.json({ project: inserted[0] }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
