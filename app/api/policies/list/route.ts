import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Try to read minimal set; if policies table doesn't exist, return empty list.
    const rows = (await sql`
      select id, name, description, category, severity, created_at
      from policies
      order by created_at desc
      limit 200;
    `.catch(() => [])) as any[]

    return NextResponse.json({ policies: rows ?? [] }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
