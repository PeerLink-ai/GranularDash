import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql as neonSql } from "@/lib/db"
import { encryptSecret } from "@/lib/crypto"
import { addAuditLog } from "@/lib/audit-store"

function isValidUrl(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

async function performHealthCheck(endpoint: string, apiKey?: string) {
  // Consider reachable if we get any non-network error and status < 500
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const started = Date.now()
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: controller.signal,
    })
    const ms = Date.now() - started
    // 2xx-4xx considered reachable (4xx likely auth/route), 5xx is provider down
    const reachable = res.status < 500
    return { reachable, status: res.status, ms }
  } catch (e) {
    return { reachable: false, status: 0, ms: Date.now() - started, error: String(e) }
  } finally {
    clearTimeout(timeout)
  }
}

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await tableExists("connected_agents"))) {
      return NextResponse.json({ agents: [] })
    }

    const rows = await neonSql`
      SELECT
        id::text AS id,
        COALESCE(name, agent_id) AS name,
        provider,
        model,
        status,
        project_id::text AS project_id,
        usage_requests,
        usage_tokens_used,
        usage_estimated_cost
      FROM connected_agents
      WHERE user_id = ${user.id}
      ORDER BY connected_at DESC NULLS LAST
      LIMIT 500
    `
    return NextResponse.json({ agents: rows })
  } catch (e) {
    console.error("Agents list error:", e)
    return NextResponse.json({ agents: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, endpoint, apiKey, description } = await req.json()

    // Server-side validations
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Please provide a valid agent name (min 2 chars)." }, { status: 400 })
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Please select a provider." }, { status: 400 })
    }
    if (!endpoint || typeof endpoint !== "string" || !isValidUrl(endpoint)) {
      return NextResponse.json({ error: "Please provide a valid HTTP(S) endpoint URL." }, { status: 400 })
    }
    if (apiKey && typeof apiKey !== "string") {
      return NextResponse.json({ error: "Invalid API key." }, { status: 400 })
    }
    if (description && typeof description !== "string") {
      return NextResponse.json({ error: "Invalid description/model." }, { status: 400 })
    }

    // Duplicate check (same endpoint for this user)
    const dup = await neonSql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM connected_agents WHERE user_id = ${user.id} AND endpoint = ${endpoint}
      ) AS exists
    `
    if (dup[0]?.exists) {
      return NextResponse.json({ error: "An agent with this endpoint already exists." }, { status: 409 })
    }

    // Live health check
    const health = await performHealthCheck(endpoint, apiKey)
    const status: "active" | "inactive" | "error" = health.reachable ? "active" : "error"

    // Encrypt API key if provided
    const encrypted = encryptSecret(apiKey)

    const inserted = await neonSql<any[]>`
      INSERT INTO connected_agents (
        user_id,
        name,
        provider,
        model,
        endpoint,
        api_key_encrypted,
        status,
        connected_at,
        last_active
      ) VALUES (
        ${user.id},
        ${name.trim()},
        ${type},
        ${description || "default"},
        ${endpoint},
        ${encrypted},
        ${status},
        NOW(),
        NULL
      )
      RETURNING *
    `
    const newAgent = inserted[0]

    // Normalize for client (type/version)
    const agentForClient = {
      id: newAgent.id,
      name: newAgent.name,
      type: newAgent.provider,
      version: newAgent.model,
      status: newAgent.status,
      endpoint: newAgent.endpoint,
      connected_at: newAgent.connected_at,
      last_active: newAgent.last_active ?? null,
    }

    // Audit log
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined
    const userAgent = req.headers.get("user-agent") || undefined

    await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: "agent_connected",
      resourceType: "agent",
      resourceId: String(newAgent.id),
      details: {
        name,
        provider: type,
        model: description || "default",
        endpoint,
        health,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(
      {
        message: "Agent connected successfully",
        agent: agentForClient,
        health,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("POST /api/agents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
