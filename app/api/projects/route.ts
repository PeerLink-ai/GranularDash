import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"
import { randomUUID } from "crypto"

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

export async function GET(_req: NextRequest) {
  try {
    if (!(await tableExists("projects"))) {
      return NextResponse.json({ items: [], projects: [] })
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
      ORDER BY pinned DESC, updated_at DESC NULLS LAST
      LIMIT 500
    `
    return NextResponse.json({ items: rows, projects: rows })
  } catch (e) {
    console.error("Projects list error:", e)
    return NextResponse.json({ items: [], projects: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description = null, type = "native", repo_url = null, metadata = null, pinned = false } = body
    if (!name) {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 })
    }
    if (!(await tableExists("projects"))) {
      // Try to create the projects table on the fly
      try {
        await neonSql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
        await query(`
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(20) NOT NULL DEFAULT 'native',
            repo_url TEXT,
            metadata JSONB,
            pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `)
      } catch (e) {
        console.warn("Auto-create projects table failed:", e)
      }
    }

    const id = randomUUID()
    const insert = await query(
      `INSERT INTO projects (id, name, description, type, repo_url, metadata, pinned, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING id::text AS id, name`,
      [id, name, description, type, repo_url, metadata, !!pinned],
    )
    return NextResponse.json({ success: true, project: insert.rows?.[0] ?? { id, name } })
  } catch (e) {
    console.error("Create project error:", e)
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 })
  }
}
