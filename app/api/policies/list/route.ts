import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensurePoliciesSchema } from "@/lib/projects-schema"

export async function GET() {
  try {
    await ensurePoliciesSchema()
    const rows = await sql`SELECT id, name, description, category, severity FROM policies ORDER BY name ASC`
    if (rows.length > 0) return NextResponse.json({ policies: rows })
    // Seed a sensible default set if none exist:
    const seed = [
      {
        id: crypto.randomUUID(),
        name: "PII Redaction",
        description: "Mask personally identifiable information.",
        category: "privacy",
        severity: "high",
      },
      {
        id: crypto.randomUUID(),
        name: "Production Write Guard",
        description: "Require approval for write/mod ops.",
        category: "safety",
        severity: "critical",
      },
      {
        id: crypto.randomUUID(),
        name: "Secrets Access Control",
        description: "Block unapproved secrets access.",
        category: "security",
        severity: "high",
      },
      {
        id: crypto.randomUUID(),
        name: "Data Residency",
        description: "Keep data in allowed regions only.",
        category: "compliance",
        severity: "medium",
      },
    ]
    for (const p of seed) {
      await sql`INSERT INTO policies (id, name, description, category, severity) VALUES (${p.id}, ${p.name}, ${p.description}, ${p.category}, ${p.severity}) ON CONFLICT DO NOTHING`
    }
    return NextResponse.json({ policies: seed })
  } catch (e: any) {
    return NextResponse.json({ policies: [] })
  }
}
