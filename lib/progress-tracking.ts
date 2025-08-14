export interface LearningPath {
  id: string
  name: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedDuration: number // in hours
  prerequisites: string[]
  modules: LearningModule[]
  competencies: string[]
  certification?: {
    name: string
    requirements: string[]
    validityPeriod: number
  }
}

export interface LearningModule {
  id: string
  name: string
  type: "training" | "simulation" | "quiz" | "reading" | "video"
  estimatedTime: number // in minutes
  required: boolean
  order: number
  prerequisites?: string[]
}

export interface UserProgress {
  userId: number
  pathId: string
  startedAt: Date
  completedAt?: Date
  currentModuleId?: string
  completedModules: string[]
  overallProgress: number // 0-100
  timeSpent: number // in minutes
  averageScore: number
  status: "not_started" | "in_progress" | "completed" | "paused"
  lastActivity: Date
}

export interface CompetencyLevel {
  skill: string
  category: string
  currentLevel: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  targetLevel: "novice" | "beginner" | "intermediate" | "advanced" | "expert"
  progress: number // 0-100
  lastAssessed: Date
  assessmentScore?: number
  evidenceCount: number
  nextMilestone?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: string
  type: "completion" | "performance" | "streak" | "milestone"
  criteria: {
    metric: string
    threshold: number
    timeframe?: string
  }
  badge: {
    icon: string
    color: string
  }
  points: number
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

export interface UserAchievement {
  achievementId: string
  userId: number
  earnedAt: Date
  progress: number
  completed: boolean
}

export interface ProgressAnalytics {
  totalTimeSpent: number
  modulesCompleted: number
  averageScore: number
  streakDays: number
  competenciesImproved: number
  certificationsEarned: number
  weeklyActivity: { week: string; minutes: number; modules: number }[]
  skillRadar: { skill: string; level: number; target: number }[]
  performanceTrend: { date: string; score: number; category: string }[]
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "security-fundamentals",
    name: "Security Awareness Fundamentals",
    description: "Comprehensive foundation in cybersecurity awareness and best practices",
    category: "Security Awareness",
    difficulty: "beginner",
    estimatedDuration: 8,
    prerequisites: [],
    modules: [
      {
        id: "phishing-basics",
        name: "Phishing Detection Basics",
        type: "training",
        estimatedTime: 45,
        required: true,
        order: 1,
      },
      {
        id: "password-security",
        name: "Password Security Best Practices",
        type: "training",
        estimatedTime: 30,
        required: true,
        order: 2,
      },
      {
        id: "phishing-quiz",
        name: "Phishing Fundamentals Quiz",
        type: "quiz",
        estimatedTime: 30,
        required: true,
        order: 3,
        prerequisites: ["phishing-basics"],
      },
      {
        id: "email-simulation",
        name: "Email Security Simulation",
        type: "simulation",
        estimatedTime: 25,
        required: true,
        order: 4,
        prerequisites: ["phishing-quiz"],
      },
      {
        id: "social-engineering",
        name: "Social Engineering Awareness",
        type: "training",
        estimatedTime: 40,
        required: false,
        order: 5,
      },
      {
        id: "usb-security",
        name: "Physical Security & USB Threats",
        type: "simulation",
        estimatedTime: 15,
        required: false,
        order: 6,
      },
    ],
    competencies: ["Email Security", "Password Management", "Threat Recognition", "Incident Reporting"],
    certification: {
      name: "Security Awareness Certified",
      requirements: ["Complete all required modules", "Score 80% or higher on final assessment"],
      validityPeriod: 365,
    },
  },
  {
    id: "incident-response-professional",
    name: "Incident Response Professional",
    description: "Advanced training for incident response team members and security professionals",
    category: "Incident Response",
    difficulty: "advanced",
    estimatedDuration: 16,
    prerequisites: ["security-fundamentals"],
    modules: [
      {
        id: "ir-framework",
        name: "NIST Incident Response Framework",
        type: "training",
        estimatedTime: 60,
        required: true,
        order: 1,
      },
      {
        id: "threat-analysis",
        name: "Threat Analysis and Classification",
        type: "training",
        estimatedTime: 45,
        required: true,
        order: 2,
      },
      {
        id: "containment-strategies",
        name: "Containment and Eradication Strategies",
        type: "training",
        estimatedTime: 50,
        required: true,
        order: 3,
      },
      {
        id: "ransomware-simulation",
        name: "Ransomware Response Simulation",
        type: "simulation",
        estimatedTime: 45,
        required: true,
        order: 4,
        prerequisites: ["ir-framework", "containment-strategies"],
      },
      {
        id: "forensics-basics",
        name: "Digital Forensics Fundamentals",
        type: "training",
        estimatedTime: 75,
        required: true,
        order: 5,
      },
      {
        id: "communication-crisis",
        name: "Crisis Communication Management",
        type: "training",
        estimatedTime: 40,
        required: true,
        order: 6,
      },
      {
        id: "ir-assessment",
        name: "Incident Response Comprehensive Assessment",
        type: "quiz",
        estimatedTime: 60,
        required: true,
        order: 7,
        prerequisites: ["ransomware-simulation", "forensics-basics"],
      },
    ],
    competencies: [
      "Incident Classification",
      "Threat Analysis",
      "Containment Planning",
      "Digital Forensics",
      "Crisis Communication",
      "Recovery Planning",
    ],
    certification: {
      name: "Certified Incident Response Professional",
      requirements: [
        "Complete all required modules",
        "Score 85% or higher on comprehensive assessment",
        "Complete advanced simulation scenarios",
      ],
      validityPeriod: 180,
    },
  },
  {
    id: "ai-ethics-specialist",
    name: "AI Ethics & Safety Specialist",
    description: "Comprehensive training on ethical AI development and deployment",
    category: "AI Ethics & Safety",
    difficulty: "intermediate",
    estimatedDuration: 12,
    prerequisites: [],
    modules: [
      {
        id: "ai-bias-fundamentals",
        name: "Understanding AI Bias and Fairness",
        type: "training",
        estimatedTime: 50,
        required: true,
        order: 1,
      },
      {
        id: "fairness-metrics",
        name: "Fairness Metrics and Evaluation",
        type: "training",
        estimatedTime: 45,
        required: true,
        order: 2,
      },
      {
        id: "bias-simulation",
        name: "Biased Hiring Algorithm Simulation",
        type: "simulation",
        estimatedTime: 30,
        required: true,
        order: 3,
        prerequisites: ["ai-bias-fundamentals"],
      },
      {
        id: "explainable-ai",
        name: "Explainable AI and Transparency",
        type: "training",
        estimatedTime: 40,
        required: true,
        order: 4,
      },
      {
        id: "privacy-ai",
        name: "Privacy-Preserving AI Techniques",
        type: "training",
        estimatedTime: 55,
        required: false,
        order: 5,
      },
      {
        id: "ai-governance",
        name: "AI Governance and Policy Framework",
        type: "training",
        estimatedTime: 35,
        required: true,
        order: 6,
      },
      {
        id: "ethics-assessment",
        name: "AI Ethics Comprehensive Assessment",
        type: "quiz",
        estimatedTime: 45,
        required: true,
        order: 7,
        prerequisites: ["bias-simulation", "explainable-ai", "ai-governance"],
      },
    ],
    competencies: [
      "Bias Detection",
      "Fairness Evaluation",
      "AI Transparency",
      "Ethical Framework",
      "Policy Development",
    ],
    certification: {
      name: "AI Ethics & Safety Specialist",
      requirements: [
        "Complete all required modules",
        "Score 80% or higher on ethics assessment",
        "Complete bias mitigation simulation",
      ],
      validityPeriod: 270,
    },
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first training module",
    category: "Getting Started",
    type: "completion",
    criteria: { metric: "modules_completed", threshold: 1 },
    badge: { icon: "👶", color: "#10B981" },
    points: 10,
    rarity: "common",
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Score 100% on any quiz",
    category: "Performance",
    type: "performance",
    criteria: { metric: "quiz_perfect_score", threshold: 1 },
    badge: { icon: "🎯", color: "#F59E0B" },
    points: 50,
    rarity: "uncommon",
  },
  {
    id: "learning-streak",
    name: "Learning Streak",
    description: "Complete training activities for 7 consecutive days",
    category: "Consistency",
    type: "streak",
    criteria: { metric: "consecutive_days", threshold: 7 },
    badge: { icon: "🔥", color: "#EF4444" },
    points: 75,
    rarity: "rare",
  },
  {
    id: "security-champion",
    name: "Security Champion",
    description: "Complete the Security Fundamentals learning path",
    category: "Certification",
    type: "completion",
    criteria: { metric: "path_completed", threshold: 1 },
    badge: { icon: "🛡️", color: "#3B82F6" },
    points: 200,
    rarity: "epic",
  },
  {
    id: "incident-commander",
    name: "Incident Commander",
    description: "Master all incident response simulations with 90%+ scores",
    category: "Mastery",
    type: "performance",
    criteria: { metric: "ir_simulation_mastery", threshold: 90 },
    badge: { icon: "⚡", color: "#8B5CF6" },
    points: 300,
    rarity: "legendary",
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    description: "Complete 25 training modules",
    category: "Progress",
    type: "milestone",
    criteria: { metric: "modules_completed", threshold: 25 },
    badge: { icon: "📚", color: "#06B6D4" },
    points: 100,
    rarity: "uncommon",
  },
  {
    id: "simulation-expert",
    name: "Simulation Expert",
    description: "Complete 10 different simulation scenarios",
    category: "Experience",
    type: "completion",
    criteria: { metric: "simulations_completed", threshold: 10 },
    badge: { icon: "🎮", color: "#84CC16" },
    points: 150,
    rarity: "rare",
  },
]

export function calculateCompetencyLevel(
  assessmentScores: number[],
  completedModules: string[],
  timeSpent: number,
): "novice" | "beginner" | "intermediate" | "advanced" | "expert" {
  const avgScore =
    assessmentScores.length > 0 ? assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length : 0
  const moduleCount = completedModules.length
  const hoursSpent = timeSpent / 60

  if (avgScore >= 95 && moduleCount >= 15 && hoursSpent >= 20) return "expert"
  if (avgScore >= 85 && moduleCount >= 10 && hoursSpent >= 12) return "advanced"
  if (avgScore >= 75 && moduleCount >= 6 && hoursSpent >= 6) return "intermediate"
  if (avgScore >= 60 && moduleCount >= 3 && hoursSpent >= 2) return "beginner"
  return "novice"
}

export function generateLearningRecommendations(
  userProgress: UserProgress[],
  competencies: CompetencyLevel[],
): {
  nextModules: string[]
  skillGaps: string[]
  suggestedPaths: string[]
  priorityAreas: string[]
} {
  const completedPaths = userProgress.filter((p) => p.status === "completed").map((p) => p.pathId)
  const inProgressPaths = userProgress.filter((p) => p.status === "in_progress").map((p) => p.pathId)

  const weakCompetencies = competencies
    .filter((c) => c.progress < 70)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 3)

  const availablePaths = LEARNING_PATHS.filter(
    (path) =>
      !completedPaths.includes(path.id) &&
      !inProgressPaths.includes(path.id) &&
      path.prerequisites.every((prereq) => completedPaths.includes(prereq)),
  )

  return {
    nextModules: inProgressPaths.length > 0 ? ["Continue current learning path"] : [],
    skillGaps: weakCompetencies.map((c) => c.skill),
    suggestedPaths: availablePaths.slice(0, 3).map((p) => p.name),
    priorityAreas: weakCompetencies.map((c) => c.category),
  }
}

export function checkAchievements(
  userId: number,
  userStats: {
    modulesCompleted: number
    quizPerfectScores: number
    consecutiveDays: number
    pathsCompleted: number
    simulationsCompleted: number
    avgSimulationScore: number
  },
  currentAchievements: string[],
): Achievement[] {
  const newAchievements: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (currentAchievements.includes(achievement.id)) continue

    let earned = false
    switch (achievement.criteria.metric) {
      case "modules_completed":
        earned = userStats.modulesCompleted >= achievement.criteria.threshold
        break
      case "quiz_perfect_score":
        earned = userStats.quizPerfectScores >= achievement.criteria.threshold
        break
      case "consecutive_days":
        earned = userStats.consecutiveDays >= achievement.criteria.threshold
        break
      case "path_completed":
        earned = userStats.pathsCompleted >= achievement.criteria.threshold
        break
      case "simulations_completed":
        earned = userStats.simulationsCompleted >= achievement.criteria.threshold
        break
      case "ir_simulation_mastery":
        earned = userStats.avgSimulationScore >= achievement.criteria.threshold
        break
    }

    if (earned) {
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}
