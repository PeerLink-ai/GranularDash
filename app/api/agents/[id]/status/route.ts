import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function ping(endpoint: string, apiKey?: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const started = Date.now()
  try {
    const res = await fetch(endpoint, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: controller.signal,
    })
    const ms = Date.now() - started
    return { ok: res.status < 500, status: res.status, ms }
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - started, error: String(e) }
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const rows =
      await sql`SELECT id, endpoint, api_key_encrypted, status FROM connected_agents WHERE id = ${params.id} LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const agent = rows[0]
    const health = await ping(agent.endpoint)

    const status: "active" | "inactive" | "error" = health.ok ? "active" : "error"
    const updated = await sql`
      UPDATE connected_agents
      SET status = ${status}, last_health_check = now(), health_status = ${health.ok ? "healthy" : "unhealthy"}
      WHERE id = ${params.id}
      RETURNING id, status, last_health_check, health_status
    `
    return NextResponse.json({ health, agent: updated[0] })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
