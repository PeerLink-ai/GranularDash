import SystemHealthOverview from "@/components/system-health-overview"
import RecentActivity from "@/components/recent-activity"
import ConnectedAgentsOverview from "@/components/connected-agents-overview"
import KeyGovernanceMetrics from "@/components/key-governance-metrics"

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Governance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and govern your AI agents with comprehensive oversight and compliance tracking.
        </p>
      </div>
      <SystemHealthOverview />
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <ConnectedAgentsOverview />
      </div>
      <KeyGovernanceMetrics />
    </div>
  )
}
