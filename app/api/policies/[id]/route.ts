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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hasGovernance = await tableExists("governance_policies")
    const table = hasGovernance ? "governance_policies" : (await tableExists("policies")) ? "policies" : null
    if (!table) return NextResponse.json({ policy: null }, { status: 404 })

    const hasOrgId = await columnExists(table, "organization_id")
    const orgCol = hasOrgId ? "organization_id" : (await columnExists(table, "organization")) ? "organization" : null

    const rows = await query(
      `
      SELECT
        id::text AS id,
        name,
        COALESCE(description,'') AS description,
        COALESCE(type,'policy') AS type,
        COALESCE(status,'active') AS status,
        COALESCE(severity,'medium') AS severity,
        ${orgCol ? orgCol : `'unknown'`} AS organization,
        COALESCE(updated_at, created_at, NOW()) AS updated_at,
        COALESCE(created_at, NOW()) AS created_at
      FROM ${table}
      WHERE id = $1::uuid
      LIMIT 1
    `,
      [params.id],
    )
    if (!rows.rows?.length) return NextResponse.json({ policy: null }, { status: 404 })
    return NextResponse.json({ policy: rows.rows[0] })
  } catch (e) {
    console.error("Get policy error:", e)
    return NextResponse.json({ policy: null }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hasGovernance = await tableExists("governance_policies")
    const table = hasGovernance ? "governance_policies" : (await tableExists("policies")) ? "policies" : null
    if (!table) return NextResponse.json({ success: false, error: "No policy table" }, { status: 404 })

    const body = await req.json()
    const { name, description, type, severity, status } = body

    await query(
      `
      UPDATE ${table} SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        severity = COALESCE($5, severity),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $1::uuid
    `,
      [params.id, name, description, type, severity, status],
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Update policy error:", e)
    return NextResponse.json({ success: false, error: "Failed to update policy" }, { status: 500 })
  }
}
