import { AuditLogTable } from "@/components/audit-log-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Log Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">1,234,567</div>
            <p className="text-sm text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">87</div>
            <p className="text-sm text-muted-foreground">Critical failures in last 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top User/Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AI-Finance-001</div>
            <p className="text-sm text-muted-foreground">Most active in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <AuditLogTable />
    </div>
  )
}
