"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, RotateCcw } from "lucide-react"

export function SimulationControls() {
  const [simulationType, setSimulationType] = useState("")
  const [scenario, setScenario] = useState("")
  const [agentTarget, setAgentTarget] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [simulationLog, setSimulationLog] = useState<string[]>([])

  const handleStartSimulation = () => {
    if (simulationType && scenario && agentTarget) {
      setIsRunning(true)
      setSimulationLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Starting ${simulationType} simulation for ${agentTarget}...`,
      ])
      // Simulate a delay and outcome
      setTimeout(() => {
        setSimulationLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Simulation completed. Outcome: Success.`,
        ])
        setIsRunning(false)
      }, 3000)
    } else {
      alert("Please fill all simulation parameters.")
    }
  }

  const handlePauseSimulation = () => {
    setIsRunning(false)
    setSimulationLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Simulation paused.`])
  }

  const handleResetSimulation = () => {
    setIsRunning(false)
    setSimulationType("")
    setScenario("")
    setAgentTarget("")
    setSimulationLog([])
    alert("Simulation parameters reset.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run New Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="simulationType">Simulation Type</Label>
            <Select value={simulationType} onValueChange={setSimulationType} disabled={isRunning}>
              <SelectTrigger id="simulationType">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phishing">Phishing Attack</SelectItem>
                <SelectItem value="breach">Data Breach Drill</SelectItem>
                <SelectItem value="bias">AI Bias Test</SelectItem>
                <SelectItem value="compliance">Compliance Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentTarget">Target Agent/System</Label>
            <Input
              id="agentTarget"
              placeholder="e.g., AI-Finance-001, Employee Network"
              value={agentTarget}
              onChange={(e) => setAgentTarget(e.target.value)}
              disabled={isRunning}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scenario">Scenario Description</Label>
          <Textarea
            id="scenario"
            placeholder="Describe the simulation scenario..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartSimulation} disabled={isRunning || !simulationType || !scenario || !agentTarget}>
            <Play className="mr-2 h-4 w-4" /> Start Simulation
          </Button>
          <Button variant="outline" onClick={handlePauseSimulation} disabled={!isRunning}>
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
          <Button variant="ghost" onClick={handleResetSimulation} disabled={isRunning}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Simulation Log</Label>
          <div className="border rounded-md p-4 h-40 overflow-y-auto bg-muted/20 text-sm font-mono">
            {simulationLog.length === 0 ? (
              <p className="text-muted-foreground">No log entries yet.</p>
            ) : (
              simulationLog.map((entry, index) => <p key={index}>{entry}</p>)
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
