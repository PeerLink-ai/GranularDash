"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/user-management-table"
import { Users, UserCheck, Clock, Shield } from "lucide-react"

interface UserStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  adminUsers: number
  growthPercentage: number
  activeRate: number
}

export default function UsersRolesPage() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    adminUsers: 0,
    growthPercentage: 0,
    activeRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/users/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Users & Roles</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage user accounts and permissions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${stats.growthPercentage >= 0 ? "+" : ""}${stats.growthPercentage}% from last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${stats.activeRate}% active rate`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">Elevated privileges</p>
          </CardContent>
        </Card>
      </div>

      <UserManagementTable />
    </div>
  )
}
