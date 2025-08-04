"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/user-management-table"
import { Users, Shield, Clock, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  pendingUsers: number
}

export default function UsersRolesPage() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    pendingUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/users/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast.error("Failed to fetch user statistics")
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Failed to fetch user statistics")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-muted-foreground">Manage users and their permissions within your organization.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers === 1 ? "Active account" : "Active accounts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Logged in within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">Users with elevated privileges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Awaiting registration</p>
          </CardContent>
        </Card>
      </div>

      <UserManagementTable />
    </div>
  )
}
