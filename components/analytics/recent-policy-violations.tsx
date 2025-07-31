import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, ShieldOff } from "lucide-react"

const recentViolations = [
  {
    id: "1",
    agentId: "AI-Finance-001",
    policy: "Financial Compliance",
    severity: "High",
    date: "2023-07-25",
    icon: AlertTriangle,
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/375238645_11475210.jpg-lU8bOe6TLt5Rv51hgjg8NT8PsDBmvN.jpeg",
  },
  {
    id: "2",
    agentId: "AI-HR-002",
    policy: "Data Privacy Policy",
    severity: "Medium",
    date: "2023-07-24",
    icon: ShieldOff,
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/375238208_11475222.jpg-poEIzVHAGiIfMFQ7EiF8PUG1u0Zkzz.jpeg",
  },
  {
    id: "3",
    agentId: "AI-Legal-003",
    policy: "Ethical AI Use",
    severity: "High",
    date: "2023-07-23",
    icon: AlertTriangle,
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dd.jpg-4MCwPC2Bec6Ume26Yo1kao3CnONxDg.jpeg",
  },
  {
    id: "4",
    agentId: "AI-Marketing-006",
    policy: "Brand Guidelines",
    severity: "Low",
    date: "2023-07-22",
    icon: ShieldOff,
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9334178.jpg-Y74tW6XFO68g7N36SE5MSNDNVKLQ08.jpeg",
  },
  {
    id: "5",
    agentId: "AI-Energy-007",
    policy: "Operational Safety",
    severity: "Medium",
    date: "2023-07-21",
    icon: AlertTriangle,
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5295.jpg-fLw0wGGZp8wuTzU5dnyfjZDwAHN98a.jpeg",
  },
]

export function RecentPolicyViolations() {
  return (
    <div className="space-y-4">
      {recentViolations.map((violation) => (
        <Card key={violation.id} className="p-4">
          <CardContent className="flex items-center p-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={violation.avatar || "/placeholder.svg"} alt={violation.agentId} />
              <AvatarFallback>{violation.agentId.split("-")[1]}</AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{violation.agentId}</p>
              <p className="text-xs text-muted-foreground">{violation.policy}</p>
            </div>
            <div className="ml-auto text-right">
              <p
                className={`text-sm font-medium ${violation.severity === "High" ? "text-red-500" : violation.severity === "Medium" ? "text-yellow-500" : "text-blue-500"}`}
              >
                {violation.severity}
              </p>
              <p className="text-xs text-muted-foreground">{violation.date}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
