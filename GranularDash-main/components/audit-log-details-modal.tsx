"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function AuditLogDetailsModal({ isOpen, onOpenChange, log }) {
  if (!log) return null

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agent Action Details</DialogTitle>
          <DialogDescription>Detailed information about the selected agent action.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Timestamp:</span>
            <span>{formatTimestamp(log.timestamp)}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Agent ID:</span>
            <span>{log.agentId}</span>
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
            <span className={`${
              log.status === 'Success' ? 'text-green-600' :
              log.status === 'Failed' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {log.status}
            </span>
          </div>
          {log.agentApiUrl && (
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">API URL:</span>
              <span className="text-xs break-all">{log.agentApiUrl}</span>
            </div>
          )}
          {log.agentType && (
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Agent Type:</span>
              <span>{log.agentType}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium">Details:</span>
            <span>{log.details}</span>
          </div>
          {log.agentError && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-1">
                <span className="font-medium text-red-600">Error:</span>
                <span className="text-red-600 text-xs break-all">{log.agentError}</span>
              </div>
            </>
          )}
          {log.agentResponse && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-1">
                <span className="font-medium text-green-600">Agent Response:</span>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(log.agentResponse, null, 2)}
                </pre>
              </div>
            </>
          )}
          {log.result && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-1">
                <span className="font-medium">Result:</span>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(log.result, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
