import { SystemHealthOverview } from "@/components/system-health-overview"
import { RecentAgentActivities } from "@/components/recent-agent-activities"
import { PolicyViolations } from "@/components/policy-violations" // Corrected import
import { KeyGovernanceMetrics } from "@/components/key-governance-metrics"
import { AnomalyTrendChart } from "@/components/anomaly-trend-chart"
import { AgentResourceUsage } from "@/components/agent-resource-usage"
import { AuditReadiness } from "@/components/audit-readiness"
import { ScheduledAudits } from "@/components/scheduled-audits"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">AI Governance Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SystemHealthOverview />
        </div>
        <div className="lg:col-span-1">
          <RecentAgentActivities />
        </div>
        <div className="lg:col-span-1">
          <PolicyViolations /> {/* Using the corrected component name */}
        </div>
      </div>

      <KeyGovernanceMetrics />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnomalyTrendChart />
        </div>
        <div className="lg:col-span-1">
          <AgentResourceUsage />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AuditReadiness />
        </div>
        <div className="lg:col-span-2">
          <ScheduledAudits />
        </div>
      </div>
    </div>
  )
}
