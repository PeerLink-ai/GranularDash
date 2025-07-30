"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

export function RecentAgentActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/agents/actions')
      const data = await response.json()
      const logs = data.logs || []
      
      // Convert logs to activity format and take the most recent 5
      const recentActivities = logs
        .map(log => ({
          id: log.id,
          agent: log.agentId,
          activity: log.action,
          timestamp: log.timestamp,
          status: log.status,
          details: log.details,
          resource: log.resource
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
      
      setActivities(recentActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} minutes ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading activities...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Agent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent agent activities. Connect an agent to see activity logs.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.agent}</TableCell>
                  <TableCell>{activity.activity}</TableCell>
                  <TableCell>
                    <Badge className={
                      activity.status === 'Success' ? 'bg-green-100 text-green-800' :
                      activity.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(activity)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected agent activity.
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Agent</label>
                  <p className="text-sm text-muted-foreground">{selectedActivity.agent}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Activity</label>
                  <p className="text-sm text-muted-foreground">{selectedActivity.activity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedActivity.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource</label>
                  <p className="text-sm text-muted-foreground">{selectedActivity.resource}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Details</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedActivity.details}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Timestamp</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedActivity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
