"use client"

import { useState, useEffect } from "react"
import { Bell, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

type Notification = {
  id: string
  type: "alert" | "info" | "warning"
  message: string
  timestamp: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: "notif1",
    type: "alert",
    message: "High severity policy violation detected on Agent-001.",
    timestamp: "2 mins ago",
    read: false,
  },
  {
    id: "notif2",
    type: "info",
    message: "New agent deployment completed successfully.",
    timestamp: "1 hour ago",
    read: true,
  },
  {
    id: "notif3",
    type: "warning",
    message: "Unusual activity detected on network segment B.",
    timestamp: "3 hours ago",
    read: false,
  },
  { id: "notif4", type: "info", message: "Monthly compliance report generated.", timestamp: "Yesterday", read: true },
]

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const simulateNewAlert = () => {
    const newAlert: Notification = {
      id: `notif${Date.now()}`,
      type: "alert",
      message: `New critical alert: Unauthorized access attempt detected!`,
      timestamp: "Just now",
      read: false,
    }
    setNotifications((prev) => [newAlert, ...prev])
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <X className="h-4 w-4 text-red-500" />
      case "warning":
        return <Bell className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          markAllAsRead()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium">Notifications</h4>
          <Button variant="ghost" size="sm" onClick={simulateNewAlert}>
            Simulate New Alert
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          <div className="p-4">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground">No new notifications.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 ${notification.read ? "text-muted-foreground" : "font-medium"}`}
                  >
                    <div className="pt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
