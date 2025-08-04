import SystemHealthOverview from "./components/SystemHealthOverview"
import RecentActivity from "./components/RecentActivity"
import ConnectedAgentsOverview from "./components/ConnectedAgentsOverview"
import KeyGovernanceMetrics from "./components/KeyGovernanceMetrics"

const Page = () => {
  return (
    <div>
      <h1>AI Governance Dashboard</h1>
      <SystemHealthOverview />
      <RecentActivity />
      <ConnectedAgentsOverview />
      <KeyGovernanceMetrics />
    </div>
  )
}

export default Page
