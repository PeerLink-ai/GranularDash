import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { User, UserPermission, ConnectedAgent } from "./db"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateSessionToken(): Promise<string> {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = await generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sql`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
  `

  return sessionToken
}

export async function getUserBySession(
  sessionToken: string,
): Promise<(User & { permissions: string[]; connectedAgents: ConnectedAgent[] }) | null> {
  const sessions = await sql`
    SELECT u.*, s.expires_at
    FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.session_token = ${sessionToken}
    AND s.expires_at > NOW()
  `

  if (sessions.length === 0) {
    return null
  }

  const user = sessions[0] as User & { expires_at: string }

  // Get user permissions
  const permissions = await sql`
    SELECT permission
    FROM user_permissions
    WHERE user_id = ${user.id}
  `

  // Get connected agents
  const connectedAgents = await sql`
    SELECT *
    FROM connected_agents
    WHERE user_id = ${user.id}
    ORDER BY connected_at DESC
  `

  return {
    ...user,
    permissions: permissions.map((p: UserPermission) => p.permission),
    connectedAgents: connectedAgents as ConnectedAgent[],
  }
}

export async function signInUser(
  email: string,
  password: string,
): Promise<{ user: User & { permissions: string[]; connectedAgents: ConnectedAgent[] }; sessionToken: string } | null> {
  const users = await sql`
    SELECT *
    FROM users
    WHERE email = ${email}
  `

  if (users.length === 0) {
    return null
  }

  const user = users[0] as User & { password_hash: string }

  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    return null
  }

  // Update last login
  await sql`
    UPDATE users
    SET last_login = NOW()
    WHERE id = ${user.id}
  `

  // Create session
  const sessionToken = await createSession(user.id)

  // Get user permissions
  const permissions = await sql`
    SELECT permission
    FROM user_permissions
    WHERE user_id = ${user.id}
  `

  // Get connected agents
  const connectedAgents = await sql`
    SELECT *
    FROM connected_agents
    WHERE user_id = ${user.id}
    ORDER BY connected_at DESC
  `

  const { password_hash, ...userWithoutPassword } = user

  return {
    user: {
      ...userWithoutPassword,
      permissions: permissions.map((p: UserPermission) => p.permission),
      connectedAgents: connectedAgents as ConnectedAgent[],
    },
    sessionToken,
  }
}

export async function signUpUser(
  email: string,
  password: string,
  name: string,
  organization: string,
  role = "viewer",
): Promise<{ user: User & { permissions: string[]; connectedAgents: ConnectedAgent[] }; sessionToken: string }> {
  const hashedPassword = await hashPassword(password)

  const users = await sql`
    INSERT INTO users (email, password_hash, name, organization, role)
    VALUES (${email}, ${hashedPassword}, ${name}, ${organization}, ${role})
    RETURNING *
  `

  const user = users[0] as User

  // Add comprehensive permissions for all roles - no restrictions
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
    await sql`
      INSERT INTO user_permissions (user_id, permission)
      VALUES (${user.id}, ${permission})
    `
  }

  // Create session
  const sessionToken = await createSession(user.id)

  return {
    user: {
      ...user,
      permissions: allPermissions,
      connectedAgents: [],
    },
    sessionToken,
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await sql`
    DELETE FROM user_sessions
    WHERE session_token = ${sessionToken}
  `
}

export async function completeOnboarding(userId: string): Promise<void> {
  await sql`
    UPDATE users
    SET onboarding_completed = true
    WHERE id = ${userId}
  `
}
