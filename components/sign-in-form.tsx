"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const demoAccounts = [
  {
    type: "admin",
    email: "admin@granular.ai",
    name: "Sarah Chen - Admin",
    description: "Full access to all features, multiple connected agents",
  },
  {
    type: "developer",
    email: "dev@company.com",
    name: "Alex Rodriguez - Developer",
    description: "Agent management and testing capabilities",
  },
  {
    type: "analyst",
    email: "analyst@startup.io",
    name: "Jordan Kim - Analyst",
    description: "Analytics and reporting access",
  },
  {
    type: "viewer",
    email: "viewer@enterprise.com",
    name: "Morgan Taylor - Viewer",
    description: "Read-only dashboard access",
  },
]

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("demo123")
  const [selectedDemo, setSelectedDemo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, switchUserType } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (userType: string) => {
    setIsLoading(true)
    setTimeout(() => {
      switchUserType(userType)
      setIsLoading(false)
      toast({
        title: "Demo account loaded",
        description: `Signed in as ${userType}`,
      })
    }, 500)
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Granular</h1>
          <p className="text-muted-foreground mt-2">AI Governance Dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials or try a demo account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or try demo</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Demo Accounts</Label>
              <Select value={selectedDemo} onValueChange={setSelectedDemo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a demo account" />
                </SelectTrigger>
                <SelectContent>
                  {demoAccounts.map((account) => (
                    <SelectItem key={account.type} value={account.type}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground">{account.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDemo && (
                <Button
                  onClick={() => handleDemoLogin(selectedDemo)}
                  className="w-full"
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Try {selectedDemo} Demo
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Demo password: <code className="bg-muted px-1 rounded">demo123</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
