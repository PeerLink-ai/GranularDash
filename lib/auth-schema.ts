// Creates/updates minimal auth tables used by the API.
// Safe to call on each request; uses IF NOT EXISTS guards.

import { sql } from "@/lib/db"

export async function ensureAuthSchema() {
  // users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      role TEXT NOT NULL,
      onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE
    )
  `

  // user_permissions
  await sql`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`

  // user_sessions
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `

  // Add missing columns (if older tables exist)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`

  // Optional: connected_agents table might be used by UI; only create if missing
  await sql`
    CREATE TABLE IF NOT EXISTS connected_agents (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      name TEXT,
      status TEXT,
      connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_connected_agents_user_id ON connected_agents(user_id)`
}
