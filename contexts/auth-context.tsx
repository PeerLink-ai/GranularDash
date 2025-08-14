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
  permissions: string[]
  connectedAgents: any[]
  created_at: string
  last_login?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, organization: string, role?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json().catch(() => ({ user: null }))
        setUser(data.user)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Sign in failed" }))
        throw new Error(error.error || "Sign in failed")
      }

      const data = await response.json().catch(() => ({ user: null }))
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, organization: string, role = "viewer") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, organization, role }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Sign up failed" }))
        throw new Error(error.error || "Sign up failed")
      }

      const data = await response.json().catch(() => ({ user: null }))
      setUser(data.user)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
