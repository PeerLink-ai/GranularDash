"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ViolationDetailsModal } from "./violation-details-modal"

export function PolicyViolations() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchViolations()
  }, [])

  const fetchViolations = async () => {
    try {
      const response = await fetch('/api/agents/actions')
      const data = await response.json()
      const logs = data.logs || []
      
      // Convert failed actions to violations
      const violations = logs
        .filter(log => log.status === 'Failed')
        .map(log => ({
          id: log.id,
          agentId: log.agentId,
          policy: log.action,
          severity: 'High',
          date: log.timestamp,
          description: log.details || 'Action failed',
          agentError: log.agentError,
          agentApiUrl: log.agentApiUrl
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5) // Show only the 5 most recent violations
      
      setViolations(violations)
    } catch (error) {
      console.error('Error fetching violations:', error)
      setViolations([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (violation) => {
    setSelectedViolation(violation)
    setIsModalOpen(true)
  }

  const handleResolveViolation = (violationId) => {
    console.log(`Resolving violation: ${violationId}`)
    // In a real system, this would update the violation status
    fetchViolations() // Refresh the list
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
          <CardTitle>Policy Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading violations...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Violations</CardTitle>
      </CardHeader>
      <CardContent>
        {violations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No policy violations detected. All agents are operating within guidelines.
          </div>
        ) : (
          <div className="space-y-4">
            {violations.map((violation) => (
              <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium">{violation.agentId}</p>
                    <Badge variant="destructive" className="text-xs">
                      {violation.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {violation.policy}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(violation.date)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(violation)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ViolationDetailsModal
        violation={selectedViolation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResolveViolation={handleResolveViolation}
      />
    </Card>
  )
}
