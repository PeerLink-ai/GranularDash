"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SignInForm() {
  const [email, setEmail] = useState("admin@granular.ai")
  const [password, setPassword] = useState("demo123")
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { signIn, switchUserType } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSigningIn(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleUserTypeChange = (value: string) => {
    switchUserType(value)
    // Set default credentials for the selected user type for convenience
    if (value === "admin") {
      setEmail("admin@granular.ai")
    } else if (value === "developer") {
      setEmail("dev@company.com")
    } else if (value === "analyst") {
      setEmail("analyst@startup.io")
    } else if (value === "viewer") {
      setEmail("viewer@enterprise.com")
    }
    setPassword("demo123") // Password remains constant for demo users
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In to Granular AI</CardTitle>
          <CardDescription>Use one of the demo accounts below to explore the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-type">Select User Type</Label>
              <Select onValueChange={handleUserTypeChange} defaultValue="admin">
                <SelectTrigger id="user-type">
                  <SelectValue placeholder="Select a user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (admin@granular.ai)</SelectItem>
                  <SelectItem value="developer">Developer (dev@company.com)</SelectItem>
                  <SelectItem value="analyst">Analyst (analyst@startup.io)</SelectItem>
                  <SelectItem value="viewer">Viewer (viewer@enterprise.com)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="demo123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSigningIn}>
              {isSigningIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
