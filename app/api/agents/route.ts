import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
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

    const rows = await sql<any[]>`
      SELECT 
        agent_id as id,
        name,
        provider AS type,
        model AS version,
        status,
        endpoint,
        connected_at,
        last_active
      FROM connected_agents
      WHERE user_id = ${user.id}
      ORDER BY connected_at DESC
    `
    return NextResponse.json({ agents: rows || [] })
  } catch (error) {
    console.error("GET /api/agents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Starting agent creation request")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      console.log("[v0] No session token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Getting user by session")
    const user = await getUserBySession(sessionToken)
    if (!user) {
      console.log("[v0] User not found for session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[v0] User found:", user.id)

    console.log("[v0] Parsing request body")
    const { name, type, endpoint, apiKey, description } = await req.json()
    console.log("[v0] Request data:", {
      name,
      type,
      endpoint: endpoint?.substring(0, 50),
      hasApiKey: !!apiKey,
      description,
    })

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

    console.log("[v0] Checking for duplicates")
    // Duplicate check (same endpoint for this user)
    const dup = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM connected_agents WHERE user_id = ${user.id} AND endpoint = ${endpoint}
      ) AS exists
    `
    if (dup[0]?.exists) {
      console.log("[v0] Duplicate endpoint found")
      return NextResponse.json({ error: "An agent with this endpoint already exists." }, { status: 409 })
    }

    console.log("[v0] Performing health check")
    // Live health check
    const health = await performHealthCheck(endpoint, apiKey)
    const status: "active" | "inactive" | "error" = health.reachable ? "active" : "error"
    console.log("[v0] Health check result:", health)

    console.log("[v0] Encrypting API key")
    // Encrypt API key if provided
    const encrypted = encryptSecret(apiKey)

    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log("[v0] Generated agent ID:", agentId)

    console.log("[v0] Inserting into database")
    const inserted = await sql<any[]>`
      INSERT INTO connected_agents (
        user_id,
        agent_id,
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
        ${agentId},
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
    console.log("[v0] Agent inserted successfully:", newAgent.id)

    // Normalize for client (type/version)
    const agentForClient = {
      id: newAgent.agent_id,
      name: newAgent.name,
      type: newAgent.provider,
      version: newAgent.model,
      status: newAgent.status,
      endpoint: newAgent.endpoint,
      connected_at: newAgent.connected_at,
      last_active: newAgent.last_active ?? null,
    }

    console.log("[v0] Adding audit log")
    // Audit log
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined
    const userAgent = req.headers.get("user-agent") || undefined

    try {
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
      console.log("[v0] Audit log added successfully")
    } catch (auditError) {
      console.error("[v0] Audit log failed (non-critical):", auditError)
      // Don't fail the request if audit logging fails
    }

    console.log("[v0] Agent creation completed successfully")
    return NextResponse.json(
      {
        message: "Agent connected successfully",
        agent: agentForClient,
        health,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] POST /api/agents error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
