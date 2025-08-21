"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import { ModernLoader } from "@/components/ui/modern-loader"
import { AccountCreationLoader } from "@/components/ui/account-creation-loader"

const demoAccounts = [
  {
    email: "admin@granular.ai",
    name: "Sarah Chen - Admin",
    description: "Full access to all features, multiple connected agents",
  },
  {
    email: "dev@company.com",
    name: "Alex Rodriguez - Developer",
    description: "Agent management and testing capabilities",
  },
  {
    email: "analyst@startup.io",
    name: "Jordan Kim - Analyst",
    description: "Analytics and reporting access",
  },
  {
    email: "viewer@enterprise.com",
    name: "Morgan Taylor - Viewer",
    description: "Read-only dashboard access",
  },
]

export function SignInForm() {
  const [activeTab, setActiveTab] = useState("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [showAccountCreation, setShowAccountCreation] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [signInData, setSignInData] = useState({
    email: "",
    password: "demo123",
  })

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    organization: "",
    role: "viewer",
  })

  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(signInData.email, signInData.password)
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setShowAccountCreation(true)

    try {
      await signUp(signUpData.email, signUpData.password, signUpData.name, signUpData.organization, signUpData.role)
      toast({
        title: "Account created!",
        description: "Welcome to Granular AI Governance Dashboard.",
      })
    } catch (error) {
      setShowAccountCreation(false)
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (email: string) => {
    setIsLoading(true)
    try {
      await signIn(email, "demo123")
      toast({
        title: "Demo account loaded",
        description: `Signed in successfully`,
      })
    } catch (error) {
      toast({
        title: "Demo login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AccountCreationLoader isVisible={showAccountCreation} onComplete={() => setShowAccountCreation(false)} />

      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to Granular</h1>
            <p className="text-muted-foreground mt-2">AI Governance Dashboard</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={(e) => setSignInData((prev) => ({ ...prev, password: e.target.value }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center">
                          <ModernLoader variant="pulse" size="sm" className="mr-2" />
                          Signing In...
                        </div>
                      ) : (
                        "Sign In"
                      )}
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
                    <div className="space-y-2">
                      {demoAccounts.map((account) => (
                        <Button
                          key={account.email}
                          onClick={() => handleDemoLogin(account.email)}
                          className="w-full justify-start h-auto p-3"
                          variant="outline"
                          disabled={isLoading}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-xs text-muted-foreground">{account.description}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    Demo password: <code className="bg-muted px-1 rounded">demo123</code>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData((prev) => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-organization">Organization</Label>
                        <Input
                          id="signup-organization"
                          type="text"
                          placeholder="Your Company"
                          value={signUpData.organization}
                          onChange={(e) => setSignUpData((prev) => ({ ...prev, organization: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@company.com"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Role</Label>
                      <Select
                        value={signUpData.role}
                        onValueChange={(value) => setSignUpData((prev) => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                          <SelectItem value="analyst">Analyst - Analytics and reports</SelectItem>
                          <SelectItem value="developer">Developer - Agent management</SelectItem>
                          <SelectItem value="admin">Admin - Full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData((prev) => ({ ...prev, password: e.target.value }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center">
                          <ModernLoader variant="morphing" size="sm" className="mr-2" />
                          Creating Account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
