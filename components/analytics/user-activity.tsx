"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ActivityData {
  id: string
  user: string
  action: string
  time: string
  avatar?: string
}

export function UserActivity() {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch("/api/activity")
        if (response.ok) {
          const data = await response.json()
          // Transform audit log data to activity format
          const formattedActivities = data.slice(0, 5).map((log: any) => ({
            id: log.id,
            user: log.user_name || "Unknown User",
            action: log.action,
            time: new Date(log.timestamp).toLocaleTimeString(),
            avatar: log.user_avatar,
          }))
          setActivities(formattedActivities)
        }
      } catch (error) {
        console.error("Failed to fetch user activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center animate-pulse">
            <div className="h-9 w-9 bg-muted rounded-full mr-4" />
            <div className="space-y-1 flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium mb-2">No Recent Activity</p>
        <p className="text-sm text-muted-foreground">
          User activities will appear here as they interact with the system
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.avatar || "/placeholder.svg"} alt="Avatar" />
            <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.user}</p>
            <p className="text-sm text-muted-foreground">{activity.action}</p>
          </div>
          <div className="ml-auto font-medium">{activity.time}</div>
        </div>
      ))}
    </div>
  )
}
