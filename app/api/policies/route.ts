import { type NextRequest, NextResponse } from "next/server"
import { sql as neonSql, query } from "@/lib/db"

async function tableExists(name: string) {
  const rows = await neonSql`SELECT to_regclass(${`public.${name}`}) AS exists`
  return rows?.[0]?.exists !== null
}

async function columnExists(table: string, column: string) {
  const rows = await neonSql`
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = ${table} 
      AND column_name = ${column}
    LIMIT 1
  `
  return rows.length > 0
}

export async function GET(_req: NextRequest) {
  try {
    const hasGovernance = await tableExists("governance_policies")
    const hasPolicies = await tableExists("policies")
    if (!hasGovernance && !hasPolicies) {
      return NextResponse.json({ items: [] })
    }
    const table = hasGovernance ? "governance_policies" : "policies"

    // Determine columns for compatibility
    const hasOrgId = await columnExists(table, "organization_id")
    const orgCol = hasOrgId ? "organization_id" : (await columnExists(table, "organization")) ? "organization" : null

    // Normalize output fields
    const text = `
      SELECT
        id::text AS id,
        name,
        COALESCE(description, '') AS description,
        COALESCE(type, 'policy') AS type,
        COALESCE(status, 'active') AS status,
        COALESCE(severity, 'medium') AS severity,
        ${orgCol ? orgCol : `'unknown'`} AS organization,
        COALESCE(updated_at, created_at, NOW()) AS updated_at,
        COALESCE(created_at, NOW()) AS created_at
      FROM ${table}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 200
    `
    const { rows } = await query(text)
    return NextResponse.json({ items: rows })
  } catch (e) {
    console.error("Policies list error:", e)
    return NextResponse.json({ items: [] })
  }
}
