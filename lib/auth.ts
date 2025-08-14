import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import type { NextRequest } from "next/server"

const SESSION_COOKIE_NAME = "session_token"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type AuthUser = {
  id: string
  email: string
  name: string
  role: "admin" | "developer" | "analyst" | "viewer"
  organization: string
}

export type ConnectedAgent = {
  id: number
  user_id: string
  agent_id: string
  name: string | null
  status: string | null
  connected_at: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string) {
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await sql`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (${userId}, ${sessionToken}, ${expiresAt})
  `
  return sessionToken
}

export async function deleteSession(sessionToken: string) {
  await sql`DELETE FROM user_sessions WHERE session_token = ${sessionToken}`
}

async function getPermissions(userId: string): Promise<string[]> {
  try {
    const rows = await sql`SELECT permission FROM user_permissions WHERE user_id = ${userId}`
    // rows can be array of objects { permission: '...' }
    return (rows as Array<{ permission: string }>).map((r) => r.permission)
  } catch {
    return []
  }
}

async function getConnectedAgents(userId: string): Promise<ConnectedAgent[]> {
  try {
    const rows = (await sql`
      SELECT id, user_id, agent_id, name, status, connected_at
      FROM connected_agents
      WHERE user_id = ${userId}
      ORDER BY connected_at DESC
    `) as ConnectedAgent[]
    return rows
  } catch {
    return []
  }
}

export async function getUserBySession(sessionToken: string | undefined | null): Promise<AuthUser | null> {
  if (!sessionToken) return null
  try {
    const rows = await sql`
      SELECT u.id, u.email, u.name, u.role, u.organization
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
      LIMIT 1
    `
    if (!rows || rows.length === 0) return null
    const u = rows[0]
    return {
      id: String(u.id),
      email: String(u.email),
      name: String(u.name),
      role: (u.role as any) || "viewer",
      organization: String(u.organization ?? "default"),
    }
  } catch {
    return null
  }
}

export async function signInUser(email: string, password: string) {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
  if (!rows || (rows as any[]).length === 0) return null

  const user = rows[0] as AuthUser & { password_hash: string }
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return null

  await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`

  const sessionToken = await createSession(user.id)
  const [permissions, connectedAgents] = await Promise.all([getPermissions(user.id), getConnectedAgents(user.id)])

  const { password_hash, ...userWithoutPassword } = user
  return { user: { ...userWithoutPassword, permissions, connectedAgents }, sessionToken }
}

export async function signUpUser(email: string, password: string, name: string, organization: string, role = "viewer") {
  const id = crypto.randomUUID()
  const password_hash = await hashPassword(password)

  // Ensure no duplicate email
  const existing = await sql`SELECT 1 FROM users WHERE email = ${email} LIMIT 1`
  if ((existing as any[]).length > 0) {
    throw new Error("Email already exists")
  }

  await sql`
    INSERT INTO users (id, email, password_hash, name, organization, role)
    VALUES (${id}, ${email}, ${password_hash}, ${name}, ${organization}, ${role})
  `

  // Grant broad permissions by default so the demo works end-to-end.
  const allPermissions = [
    "manage_agents",
    "view_analytics",
    "manage_users",
    "manage_policies",
    "view_audit_logs",
    "test_agents",
    "view_reports",
    "view_dashboard",
    "manage_compliance",
    "manage_risk",
    "manage_incidents",
    "manage_training",
    "manage_access_control",
    "manage_financial_goals",
    "manage_transactions",
  ]
  for (const permission of allPermissions) {
    await sql`INSERT INTO user_permissions (user_id, permission) VALUES (${id}, ${permission})`
  }

  const sessionToken = await createSession(id)
  const [userRows, connectedAgents] = await Promise.all([
    sql`SELECT id, email, name, organization, role FROM users WHERE id = ${id}`,
    getConnectedAgents(id),
  ])

  const user = (userRows as AuthUser[])[0]
  return { user: { ...user, permissions: allPermissions, connectedAgents }, sessionToken }
}

export async function completeOnboarding(userId: string) {
  await sql`UPDATE users SET onboarding_completed = TRUE WHERE id = ${userId}`
}

export { SESSION_COOKIE_NAME }

export async function getUser(request: NextRequest) {
  try {
    const headerToken = request.headers.get("x-session-token")
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value || request.cookies.get("session")?.value || null
    const token = headerToken || cookieToken
    if (!token) return null
    const user = await getUserBySession(token)
    return user
  } catch {
    return null
  }
}

export async function getUserIdFromCookie(): Promise<string | null> {
  // Convenience helper if you use next/headers cookies in routes;
  // Prefer using getUserBySession in routes to get full user context.
  return null
}
