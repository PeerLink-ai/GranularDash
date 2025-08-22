"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { AuditLogsSidebar } from "./audit-logs-sidebar"

interface AuditLogTriggerProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function AuditLogTrigger({
  variant = "outline",
  size = "default",
  className = "",
  children,
}: AuditLogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setIsOpen(true)}>
        {children || (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Audit Logs
          </>
        )}
      </Button>
      <AuditLogsSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
