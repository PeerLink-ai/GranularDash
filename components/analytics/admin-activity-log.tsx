import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const adminActivities = [
  {
    id: "1",
    user: "Admin A",
    action: "Deployed AI-Finance-008",
    time: "2 minutes ago",
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9720029.jpg-Yf9h2a3kT7rYyCb648iLIeHThq5wEy.jpeg",
  },
  {
    id: "2",
    user: "Admin B",
    action: "Updated 'Data Privacy Policy'",
    time: "10 minutes ago",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/27470341_7294795.jpg-XE0zf7R8tk4rfA1vm4fAHeZ1QoVEOo.jpeg",
  },
  {
    id: "3",
    user: "Admin C",
    action: "Reviewed 'AI-Legal-003' violation",
    time: "15 minutes ago",
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/799.jpg-0tEi4Xvg5YsFoGoQfQc698q4Dygl1S.jpeg",
  },
  {
    id: "4",
    user: "Admin A",
    action: "Initiated agent quarantine for AI-HR-002",
    time: "30 minutes ago",
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9334228.jpg-eOsHCkvVrVAwcPHKYSs5sQwVKsqWpC.jpeg",
  },
]

export function AdminActivityLog() {
  return (
    <div className="space-y-4">
      {adminActivities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <CardContent className="flex items-center p-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
              <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.user}</p>
              <p className="text-xs text-muted-foreground">{activity.action}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
