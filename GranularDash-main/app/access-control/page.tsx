import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessRulesTable } from "@/components/access-rules-table" // Assuming AccessRulesTable exists and is correct

export default function AccessControlPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">78</div>
            <p className="text-sm text-muted-foreground">Active access rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last Modified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2023-07-24</div>
            <p className="text-sm text-muted-foreground">Most recent rule change</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Denied Attempts (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">15</div>
            <p className="text-sm text-muted-foreground">Unauthorized access attempts</p>
          </CardContent>
        </Card>
      </div>

      <AccessRulesTable />
    </div>
  )
}
