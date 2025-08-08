import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET /api/projects - list projects
export async function GET() {
  try {
    const rows = await sql<{
      id: string
      name: string
      description: string | null
      type: "native" | "github" | "external"
      repo_url: string | null
      metadata: any
      pinned: boolean | null
      created_at: string
      updated_at: string
    }[]>`select id, name, description, type, repo_url, metadata, coalesce(pinned,false) as pinned, created_at, updated_at from projects order by pinned desc, created_at desc`

    return NextResponse.json({ projects: rows }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to list projects" }, { status: 500 })
  }
}

// POST /api/projects - create project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      name,
      description,
      type,
      repo_url,
      metadata,
      pinned,
    }: {
      id?: string
      name: string
      description?: string
      type: "native" | "github" | "external"
      repo_url?: string
      metadata?: any
      pinned?: boolean
    } = body

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 })
    }

    if (type === "github" && !repo_url) {
      return NextResponse.json({ error: "repo_url is required for github projects" }, { status: 400 })
    }

    const newId = id ?? crypto.randomUUID()

    await sql`
      insert into projects (id, name, description, type, repo_url, metadata, pinned)
      values (${newId}, ${name}, ${description ?? null}, ${type}, ${repo_url ?? null}, ${metadata ?? {}}, ${pinned ?? false})
    `

    const [project] = await sql<any[]>`select * from projects where id = ${newId}`
    return NextResponse.json({ project }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create project" }, { status: 500 })
  }
}
