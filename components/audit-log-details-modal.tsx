"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function AuditLogDetailsModal({ isOpen, onOpenChange, log }) {
  if (!log) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>Detailed information about the selected audit log entry.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Timestamp:</span>
            <span>{log.timestamp}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">User/Agent:</span>
            <span>{log.userOrAgent}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Action:</span>
            <span>{log.action}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Resource:</span>
            <span>{log.resource}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Status:</span>
            <span>{log.status}</span>
          </div>
          {log.ipAddress && (
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">IP Address:</span>
              <span>{log.ipAddress}</span>
            </div>
          )}
          {log.details && (
            <>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 gap-1">
                <span className="font-medium">Details:</span>
                <p className="text-muted-foreground">{log.details}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
