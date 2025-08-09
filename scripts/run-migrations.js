import fs from "node:fs"
import path from "node:path"
import { neon } from "@neondatabase/serverless"

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL ||
    ""
  )
}

function readSql(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    console.log(`[skip] ${filePath} (not found)`)
    return null
  }
  const sql = fs.readFileSync(abs, "utf8")
  if (!sql.trim()) {
    console.log(`[skip] ${filePath} (empty)`)
    return null
  }
  return sql
}

async function runFile(sqlClient, filePath) {
  const content = readSql(filePath)
  if (!content) return
  console.log(`\n--- Running ${filePath} ---`)
  await sqlClient(content)
  console.log(`--- Completed ${filePath} ---`)
}

async function tableExists(sqlClient, name) {
  const rows = await sqlClient`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

async function ensureProjectIdOnAgents(sqlClient) {
  // Ensure projects table exists
  if (!(await tableExists(sqlClient, "projects"))) {
    console.log("[populate] projects table missing; creating via 019 ...")
    await runFile(sqlClient, "scripts/019-create-projects-table.sql")
  }

  // Create a default project if there isn't one
  const existing = await sqlClient`
    SELECT id::text AS id FROM projects ORDER BY created_at ASC LIMIT 1
  `
  let projectId = existing?.[0]?.id
  if (!projectId) {
    const created = await sqlClient`
      INSERT INTO projects (name, description, type, pinned)
      VALUES ('Default Project', 'Auto-created to group existing agents', 'native', true)
      RETURNING id::text AS id
    `
    projectId = created?.[0]?.id
    console.log(`[populate] Created default project: ${projectId}`)
  }

  // Link any agents without a project_id to the default project
  if (!(await tableExists(sqlClient, "connected_agents"))) {
    console.log("[populate] connected_agents does not exist; skipping population")
    return
  }

  // Ensure project_id column exists (021 adds it)
  const hasProjectCol = await sqlClient`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'connected_agents' AND column_name = 'project_id'
    LIMIT 1
  `
  if (hasProjectCol.length === 0) {
    console.log("[populate] Adding project_id to connected_agents via 021 ...")
    await runFile(sqlClient, "scripts/021-create-project-policy-relations.sql")
  }

  // Assign all NULL rows to the default project
  const updated = await sqlClient`
    UPDATE connected_agents
    SET project_id = ${projectId}
    WHERE project_id IS NULL
    RETURNING id
  `
  console.log(`[populate] Assigned ${updated.length} agent(s) to project ${projectId}`)
}

async function main() {
  const conn = getConnectionString()
  if (!conn) {
    console.error("DATABASE_URL (or POSTGRES_*) is not set")
    process.exit(1)
  }
  const sql = neon(conn)

  // Ordered, idempotent migrations we need for policy ↔ project ↔ agent linking
  const files = [
    "scripts/001-create-tables.sql",
    "scripts/019-create-projects-table.sql",
    "scripts/020-create-governance-policies.sql",
    "scripts/021-create-project-policy-relations.sql",
  ]

  console.log("Starting migrations against:", conn.replace(/:[^:@/]+@/, "://****@"))
  for (const f of files) {
    await runFile(sql, f)
  }

  // Populate connected_agents.project_id so policy creation can auto-assign
  await ensureProjectIdOnAgents(sql)

  console.log("\nAll migrations completed.")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
