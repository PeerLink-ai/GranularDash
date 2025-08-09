import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomUUID } from "crypto"

async function tableExists(name: string) {
  try {
    const rows: any[] = await sql`SELECT to_regclass(${"public." + name}) AS exists`
    return rows?.[0]?.exists !== null
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type = "soc2", projectId = null, title = `${String(type).toUpperCase()} Report`, content = "" } = body
    const id = randomUUID()
    const createdAt = new Date()

    if (await tableExists("reports")) {
      await sql`
        INSERT INTO reports (id, type, title, content, project_id, created_at, status)
        VALUES (${id}, ${type}, ${title}, ${content || `${title}\nGenerated at ${createdAt.toISOString()}`}, ${projectId}, ${createdAt}, 'ready')
      `
    }
    return NextResponse.json({ id, type, createdAt })
  } catch (e) {
    console.error("Generate report error:", e)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
