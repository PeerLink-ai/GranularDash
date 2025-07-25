import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PolicyList } from "@/components/policy-list" // Assuming PolicyList exists and is correct

export default function PoliciesRulesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Policies & Rules</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">45</div>
            <p className="text-sm text-muted-foreground">Active policies in effect</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2023-07-20</div>
            <p className="text-sm text-muted-foreground">Most recent policy change</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Policy Violations (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">5</div>
            <p className="text-sm text-muted-foreground">High severity incidents</p>
          </CardContent>
        </Card>
      </div>

      <PolicyList />
    </div>
  )
}
