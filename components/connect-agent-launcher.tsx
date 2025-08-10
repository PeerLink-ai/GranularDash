"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConnectAgentModal } from "@/components/connect-agent-modal"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ConnectAgentLauncher({
  onAgentConnected,
  buttonLabel = "Connect New Agent",
}: {
  onAgentConnected?: () => void
  buttonLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
        {buttonLabel}
      </Button>

      <ConnectAgentModal
        open={open}
        onOpenChange={setOpen}
        onAgentConnected={() => {
          onAgentConnected?.()
          // Optional local toast so this launcher can be dropped anywhere.
          toast({
            title: "Agent Connected",
            description: "Your agent has been connected and audited.",
          })
        }}
      />
    </>
  )
}
