import type React from "react"
import { Sidebar } from "antd"
import { Link } from "react-router-dom"

const AppSidebar: React.FC = () => {
  return (
    <Sidebar>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/agent-management">Agent Management</Link>
      <Link to="/analytics">Analytics</Link>
      <Link to="/policies-rules">Policies & Rules</Link>
      <Link to="/access-control">Access Control</Link>
      <Link to="/audit-logs">Audit Logs</Link>
      <Link to="/compliance-reports">Compliance Reports</Link>
      <Link to="/risk-management">Risk Management</Link>
      <Link to="/incident-response">Incident Response</Link>
      <Link to="/data-model-lineage">Data Model Lineage</Link>
      <Link to="/training-simulation">Training & Simulation</Link>
      <Link to="/users-roles">Users & Roles</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/help">Help</Link>
    </Sidebar>
  )
}

export default AppSidebar
