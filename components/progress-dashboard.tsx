"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Trophy, Target, Clock, TrendingUp, BookOpen, Award, Flame, Star, ChevronRight } from "lucide-react"
import type { UserProgress, CompetencyLevel, Achievement, ProgressAnalytics } from "@/lib/progress-tracking"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface ProgressDashboardProps {
  userId?: number
}

export function ProgressDashboard({ userId }: ProgressDashboardProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [competencies, setCompetencies] = useState<CompetencyLevel[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (targetUserId) {
      fetchProgressData()
    }
  }, [targetUserId])

  const fetchProgressData = async () => {
    setLoading(true)
    try {
      const [progressRes, competenciesRes, achievementsRes, analyticsRes, recommendationsRes] = await Promise.all([
        fetch(`/api/training/progress/${targetUserId}`),
        fetch(`/api/training/competencies/${targetUserId}`),
        fetch(`/api/training/achievements/${targetUserId}`),
        fetch(`/api/training/analytics/${targetUserId}`),
        fetch(`/api/training/recommendations/${targetUserId}`),
      ])

      if (progressRes.ok) {
        const data = await progressRes.json()
        setProgress(data.progress || [])
      }

      if (competenciesRes.ok) {
        const data = await competenciesRes.json()
        setCompetencies(data.competencies || [])
      }

      if (achievementsRes.ok) {
        const data = await achievementsRes.json()
        setAchievements(data.achievements || [])
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data.analytics)
      }

      if (recommendationsRes.ok) {
        const data = await recommendationsRes.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Failed to fetch progress data:", error)
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCompetencyColor = (level: string) => {
    switch (level) {
      case "expert":
        return "bg-purple-100 text-purple-800"
      case "advanced":
        return "bg-blue-100 text-blue-800"
      case "intermediate":
        return "bg-green-100 text-green-800"
      case "beginner":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-purple-500 bg-purple-50"
      case "epic":
        return "border-blue-500 bg-blue-50"
      case "rare":
        return "border-green-500 bg-green-50"
      case "uncommon":
        return "border-yellow-500 bg-yellow-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading progress data...</p>
        </div>
      </div>
    )
  }

  const completedPaths = progress.filter((p) => p.status === "completed").length
  const inProgressPaths = progress.filter((p) => p.status === "in_progress").length
  const totalTimeSpent = analytics?.totalTimeSpent || 0
  const averageScore = analytics?.averageScore || 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPaths}</div>
            <p className="text-xs text-muted-foreground">{inProgressPaths} in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalTimeSpent / 60)}h</div>
            <p className="text-xs text-muted-foreground">{totalTimeSpent % 60}m additional</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competencies">Skills</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle>Current Learning Paths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No learning paths started yet.</p>
                  ) : (
                    progress.slice(0, 3).map((path) => (
                      <div key={path.pathId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{path.pathId}</p>
                            <p className="text-xs text-muted-foreground">
                              {path.completedModules.length} modules completed
                            </p>
                          </div>
                          <Badge variant={path.status === "completed" ? "default" : "secondary"}>{path.status}</Badge>
                        </div>
                        <Progress value={path.overallProgress} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations?.suggestedPaths?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Learning Paths</h4>
                      <div className="space-y-2">
                        {recommendations.suggestedPaths.slice(0, 2).map((path: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{path}</span>
                            <Button size="sm" variant="outline">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations?.skillGaps?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skill Development Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendations.skillGaps.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.weeklyActivity && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="minutes" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.skillRadar && (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={analytics.skillRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar name="Current" dataKey="level" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Radar name="Target" dataKey="target" stroke="#10B981" fill="transparent" strokeDasharray="5 5" />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Competency Details */}
            <Card>
              <CardHeader>
                <CardTitle>Competency Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competencies.slice(0, 6).map((comp, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{comp.skill}</p>
                          <p className="text-xs text-muted-foreground">{comp.category}</p>
                        </div>
                        <Badge className={getCompetencyColor(comp.currentLevel)}>{comp.currentLevel}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={comp.progress} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">{comp.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {achievements.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No achievements earned yet. Keep learning to unlock badges!</p>
              </div>
            ) : (
              achievements.map((achievement, index) => (
                <Card key={index} className={`${getRarityColor(achievement.rarity)} border-2`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl">{achievement.badge.icon}</div>
                      <Badge variant="outline" className="text-xs">
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-medium mb-1">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{achievement.category}</Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{achievement.points}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.performanceTrend && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Learning Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Modules Completed</span>
                    </div>
                    <span className="font-medium">{analytics?.modulesCompleted || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <span className="font-medium">{analytics?.streakDays || 0} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Certifications</span>
                    </div>
                    <span className="font-medium">{analytics?.certificationsEarned || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Skills Improved</span>
                    </div>
                    <span className="font-medium">{analytics?.competenciesImproved || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
