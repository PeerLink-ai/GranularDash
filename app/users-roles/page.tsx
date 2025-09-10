import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/user-management-table"
import { Users, UserCheck, Clock, TrendingUp, Shield } from "lucide-react"

export default function UsersRolesPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-foreground font-medium">Users & Roles</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage user accounts, roles, and permissions across your organization
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">150</div>
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <UserCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">94.7% active rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invites</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Awaiting response</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Roles</CardTitle>
            <Shield className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Elevated privileges</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserManagementTable />
    </div>
  )
}
