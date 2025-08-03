"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "admin" | "developer" | "analyst" | "viewer"
  organization: string
  connectedAgents: string[]
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  switchUserType: (userType: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users with different roles and connected agents
const demoUsers = {
  "admin@granular.ai": {
    id: "admin-1",
    email: "admin@granular.ai",
    name: "Sarah Chen",
    avatar: "/placeholder-user.jpg",
    role: "admin" as const,
    organization: "Granular AI",
    connectedAgents: ["openai-gpt4o-001", "anthropic-claude3-001", "groq-llama3-001", "replit-agent-001"],
    permissions: ["manage_agents", "view_analytics", "manage_users", "manage_policies", "view_audit_logs"],
  },
  "dev@company.com": {
    id: "dev-1",
    email: "dev@company.com",
    name: "Alex Rodriguez",
    avatar: "/placeholder-user.jpg",
    role: "developer" as const,
    organization: "TechCorp Inc",
    connectedAgents: ["openai-gpt4o-001", "replit-agent-001"],
    permissions: ["manage_agents", "view_analytics", "test_agents"],
  },
  "analyst@startup.io": {
    id: "analyst-1",
    email: "analyst@startup.io",
    name: "Jordan Kim",
    avatar: "/placeholder-user.jpg",
    role: "analyst" as const,
    organization: "StartupAI",
    connectedAgents: ["anthropic-claude3-001"],
    permissions: ["view_analytics", "view_reports"],
  },
  "viewer@enterprise.com": {
    id: "viewer-1",
    email: "viewer@enterprise.com",
    name: "Morgan Taylor",
    avatar: "/placeholder-user.jpg",
    role: "viewer" as const,
    organization: "Enterprise Corp",
    connectedAgents: [],
    permissions: ["view_dashboard"],
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("granular_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userData = demoUsers[email]
    if (userData && password === "demo123") {
      setUser(userData)
      localStorage.setItem("granular_user", JSON.stringify(userData))
    } else {
      throw new Error("Invalid credentials")
    }

    setIsLoading(false)
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("granular_user")
  }

  const switchUserType = (userType: string) => {
    const userEmails = {
      admin: "admin@granular.ai",
      developer: "dev@company.com",
      analyst: "analyst@startup.io",
      viewer: "viewer@enterprise.com",
    }

    const email = userEmails[userType]
    if (email && demoUsers[email]) {
      const userData = demoUsers[email]
      setUser(userData)
      localStorage.setItem("granular_user", JSON.stringify(userData))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, switchUserType }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
