"use client"

import { IntegratedAuditLineage } from "@/components/integrated-audit-lineage"

export default function AuditLineagePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit & Lineage Integration</h1>
          <p className="text-muted-foreground">
            Unified view of audit logs and data lineage for comprehensive governance tracking.
          </p>
        </div>
        <IntegratedAuditLineage />
      </div>
    </div>
  )
}
