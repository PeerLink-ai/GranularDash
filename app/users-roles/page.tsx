import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/user-management-table" // Assuming UserManagementTable exists and is correct

export default function UsersRolesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">150</div>
            <p className="text-sm text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admin Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">10</div>
            <p className="text-sm text-muted-foreground">Users with elevated privileges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">3</div>
            <p className="text-sm text-muted-foreground">Awaiting registration</p>
          </CardContent>
        </Card>
      </div>

      <UserManagementTable />
    </div>
  )
}
