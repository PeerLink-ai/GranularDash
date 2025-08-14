export interface Question {
  id: string
  type: "multiple_choice" | "true_false" | "essay" | "scenario" | "matching" | "ordering"
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  question: string
  options?: string[]
  correctAnswer?: string | string[] | number
  explanation?: string
  points: number
  timeLimit?: number
  resources?: string[]
  tags: string[]
}

export interface Quiz {
  id: string
  title: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  questions: Question[]
  timeLimit?: number
  passingScore: number
  maxAttempts: number
  isAdaptive: boolean
  prerequisites?: string[]
  certification?: {
    name: string
    validityPeriod: number // in days
    renewalRequired: boolean
  }
  tags: string[]
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: number
  startTime: number
  endTime?: number
  responses: QuizResponse[]
  score: number
  passed: boolean
  timeSpent: number
  feedback: string
  certificateIssued?: boolean
}

export interface QuizResponse {
  questionId: string
  answer: string | string[]
  timeSpent: number
  confidence?: number
  isCorrect: boolean
  pointsEarned: number
}

export const SECURITY_AWARENESS_QUIZZES: Quiz[] = [
  {
    id: "phishing-fundamentals",
    title: "Phishing Detection Fundamentals",
    description: "Test your ability to identify and respond to phishing attacks",
    category: "Security Awareness",
    difficulty: "beginner",
    timeLimit: 1800, // 30 minutes
    passingScore: 80,
    maxAttempts: 3,
    isAdaptive: false,
    certification: {
      name: "Phishing Awareness Certified",
      validityPeriod: 365,
      renewalRequired: true,
    },
    questions: [
      {
        id: "phish-1",
        type: "multiple_choice",
        category: "Email Security",
        difficulty: "beginner",
        question: "Which of the following is the MOST reliable indicator that an email might be a phishing attempt?",
        options: [
          "The email has spelling and grammar errors",
          "The sender's email address doesn't match the claimed organization",
          "The email asks for urgent action",
          "The email contains links or attachments",
        ],
        correctAnswer: "The sender's email address doesn't match the claimed organization",
        explanation:
          "While other factors can indicate phishing, domain spoofing is the most technical and reliable indicator. Legitimate organizations will always send from their official domains.",
        points: 10,
        timeLimit: 60,
        tags: ["phishing", "email-security", "domain-verification"],
      },
      {
        id: "phish-2",
        type: "scenario",
        category: "Response Procedures",
        difficulty: "beginner",
        question: `You receive this email:

From: security@yourbank.com
Subject: Account Verification Required

Dear Customer,
We've detected suspicious activity on your account. Please click the link below to verify your identity within 24 hours or your account will be suspended.

[Verify Account]

What should you do FIRST?`,
        options: [
          "Click the link immediately to prevent account suspension",
          "Forward the email to colleagues to warn them",
          "Check the actual sender email address and verify through official bank channels",
          "Delete the email and ignore it",
        ],
        correctAnswer: "Check the actual sender email address and verify through official bank channels",
        explanation:
          "Always verify suspicious communications through official channels. Banks will never ask for sensitive information via email.",
        points: 15,
        timeLimit: 120,
        tags: ["phishing", "verification", "incident-response"],
      },
      {
        id: "phish-3",
        type: "true_false",
        category: "Social Engineering",
        difficulty: "beginner",
        question: "Phishing emails always contain obvious spelling and grammar mistakes.",
        correctAnswer: "false",
        explanation:
          "Modern phishing attacks are increasingly sophisticated and may have perfect grammar and spelling. Attackers often use professional templates and AI tools.",
        points: 5,
        timeLimit: 30,
        tags: ["phishing", "social-engineering", "sophistication"],
      },
      {
        id: "phish-4",
        type: "matching",
        category: "Attack Types",
        difficulty: "intermediate",
        question: "Match each phishing type with its description:",
        options: [
          "Spear Phishing|Targeted attacks against specific individuals or organizations",
          "Whaling|Attacks specifically targeting high-profile executives",
          "Smishing|Phishing attacks conducted via SMS text messages",
          "Vishing|Voice-based phishing attacks conducted over phone calls",
        ],
        correctAnswer: ["Spear Phishing", "Whaling", "Smishing", "Vishing"],
        explanation:
          "Understanding different phishing types helps recognize various attack vectors and respond appropriately.",
        points: 20,
        timeLimit: 180,
        tags: ["phishing-types", "attack-vectors", "terminology"],
      },
      {
        id: "phish-5",
        type: "essay",
        category: "Incident Response",
        difficulty: "intermediate",
        question:
          "Describe the step-by-step process you would follow if you accidentally clicked on a suspicious link in a phishing email. Include immediate actions, reporting procedures, and preventive measures.",
        explanation:
          "A comprehensive response should include: immediate disconnection, password changes, malware scanning, incident reporting, monitoring for suspicious activity, and implementing additional security measures.",
        points: 25,
        timeLimit: 600,
        tags: ["incident-response", "remediation", "procedures"],
      },
    ],
    tags: ["phishing", "email-security", "beginner", "certification"],
  },
  {
    id: "advanced-threat-detection",
    title: "Advanced Threat Detection",
    description: "Advanced assessment for identifying sophisticated security threats",
    category: "Security Awareness",
    difficulty: "advanced",
    timeLimit: 3600, // 60 minutes
    passingScore: 85,
    maxAttempts: 2,
    isAdaptive: true,
    prerequisites: ["phishing-fundamentals"],
    certification: {
      name: "Advanced Threat Detection Specialist",
      validityPeriod: 180,
      renewalRequired: true,
    },
    questions: [
      {
        id: "threat-1",
        type: "scenario",
        category: "APT Detection",
        difficulty: "advanced",
        question: `You notice the following indicators in your network monitoring:

1. Unusual outbound network traffic to foreign IP addresses during off-hours
2. Multiple failed login attempts followed by successful logins from different geographic locations
3. Large file transfers to cloud storage services not approved by your organization
4. New user accounts created with administrative privileges
5. Antivirus software disabled on several workstations

What type of attack does this pattern most likely indicate?`,
        options: [
          "Random malware infection",
          "Advanced Persistent Threat (APT)",
          "Insider threat from disgruntled employee",
          "Distributed Denial of Service (DDoS) attack",
        ],
        correctAnswer: "Advanced Persistent Threat (APT)",
        explanation:
          "The combination of persistence, privilege escalation, data exfiltration, and stealth techniques strongly indicates an APT campaign designed for long-term access and data theft.",
        points: 25,
        timeLimit: 300,
        tags: ["apt", "threat-detection", "indicators"],
      },
      {
        id: "threat-2",
        type: "ordering",
        category: "Incident Response",
        difficulty: "advanced",
        question: "Order the following incident response steps for a suspected data breach:",
        options: [
          "Contain the threat and prevent further damage",
          "Identify and assess the scope of the breach",
          "Document all actions and evidence",
          "Notify relevant stakeholders and authorities",
          "Recover and restore affected systems",
          "Conduct post-incident analysis and lessons learned",
        ],
        correctAnswer: [
          "Identify and assess the scope of the breach",
          "Contain the threat and prevent further damage",
          "Document all actions and evidence",
          "Notify relevant stakeholders and authorities",
          "Recover and restore affected systems",
          "Conduct post-incident analysis and lessons learned",
        ],
        explanation:
          "Proper incident response follows the NIST framework: Identify, Contain, Document, Notify, Recover, Learn. Each step builds on the previous one.",
        points: 30,
        timeLimit: 240,
        tags: ["incident-response", "nist-framework", "procedures"],
      },
      {
        id: "threat-3",
        type: "essay",
        category: "Threat Intelligence",
        difficulty: "advanced",
        question:
          "Explain how threat intelligence can be integrated into an organization's security operations. Include sources of threat intelligence, analysis methods, and practical applications for improving security posture.",
        explanation:
          "Comprehensive answer should cover: OSINT and commercial sources, IOC analysis, threat hunting, security tool integration, risk assessment enhancement, and proactive defense strategies.",
        points: 35,
        timeLimit: 900,
        tags: ["threat-intelligence", "security-operations", "integration"],
      },
    ],
    tags: ["advanced", "threat-detection", "apt", "certification"],
  },
]

export const INCIDENT_RESPONSE_QUIZZES: Quiz[] = [
  {
    id: "ir-fundamentals",
    title: "Incident Response Fundamentals",
    description: "Core knowledge assessment for incident response procedures",
    category: "Incident Response",
    difficulty: "intermediate",
    timeLimit: 2400, // 40 minutes
    passingScore: 75,
    maxAttempts: 3,
    isAdaptive: false,
    certification: {
      name: "Incident Response Fundamentals",
      validityPeriod: 365,
      renewalRequired: true,
    },
    questions: [
      {
        id: "ir-1",
        type: "multiple_choice",
        category: "Classification",
        difficulty: "intermediate",
        question:
          "According to NIST guidelines, which factor is MOST important when classifying the severity of a security incident?",
        options: [
          "The number of systems affected",
          "The time of day the incident occurred",
          "The potential impact on business operations and data confidentiality",
          "The technical complexity of the attack",
        ],
        correctAnswer: "The potential impact on business operations and data confidentiality",
        explanation:
          "NIST emphasizes that incident severity should be based on business impact, including operational disruption and data sensitivity, rather than just technical factors.",
        points: 10,
        timeLimit: 90,
        tags: ["nist", "classification", "business-impact"],
      },
      {
        id: "ir-2",
        type: "scenario",
        category: "Containment",
        difficulty: "intermediate",
        question: `A ransomware attack has encrypted files on 20 workstations. The malware is still spreading through the network. You have the following options:

A) Shut down the entire network immediately
B) Isolate infected systems while maintaining critical business functions
C) Let the attack continue while gathering forensic evidence
D) Immediately restore all systems from backups

Which approach provides the best balance of containment and business continuity?`,
        options: [
          "Option A - Complete network shutdown",
          "Option B - Selective isolation with business continuity",
          "Option C - Continue monitoring for evidence",
          "Option D - Immediate backup restoration",
        ],
        correctAnswer: "Option B - Selective isolation with business continuity",
        explanation:
          "Selective isolation stops the spread while maintaining essential business operations. Complete shutdown may be unnecessarily disruptive, while options C and D risk further damage.",
        points: 20,
        timeLimit: 180,
        tags: ["containment", "ransomware", "business-continuity"],
      },
      {
        id: "ir-3",
        type: "essay",
        category: "Communication",
        difficulty: "intermediate",
        question:
          "Describe the key elements of effective stakeholder communication during a major security incident. Include different stakeholder groups, timing considerations, and message content guidelines.",
        explanation:
          "Should cover: executive leadership, legal/compliance, customers, employees, media, law enforcement; timing based on incident phase; clear, accurate, actionable messaging.",
        points: 25,
        timeLimit: 600,
        tags: ["communication", "stakeholders", "crisis-management"],
      },
    ],
    tags: ["incident-response", "nist", "fundamentals", "certification"],
  },
]

export function getQuizzesByCategory(category: string): Quiz[] {
  switch (category) {
    case "Security Awareness":
      return SECURITY_AWARENESS_QUIZZES
    case "Incident Response":
      return INCIDENT_RESPONSE_QUIZZES
    default:
      return []
  }
}

export function getQuizById(id: string): Quiz | undefined {
  const allQuizzes = [...SECURITY_AWARENESS_QUIZZES, ...INCIDENT_RESPONSE_QUIZZES]
  return allQuizzes.find((quiz) => quiz.id === id)
}

export function calculateQuizScore(
  quiz: Quiz,
  responses: QuizResponse[],
): {
  score: number
  passed: boolean
  feedback: string
  breakdown: { [category: string]: { correct: number; total: number; percentage: number } }
} {
  let totalPoints = 0
  let earnedPoints = 0
  const categoryBreakdown: { [category: string]: { correct: number; total: number } } = {}

  for (const question of quiz.questions) {
    totalPoints += question.points

    if (!categoryBreakdown[question.category]) {
      categoryBreakdown[question.category] = { correct: 0, total: 0 }
    }
    categoryBreakdown[question.category].total++

    const response = responses.find((r) => r.questionId === question.id)
    if (response) {
      earnedPoints += response.pointsEarned
      if (response.isCorrect) {
        categoryBreakdown[question.category].correct++
      }
    }
  }

  const score = Math.round((earnedPoints / totalPoints) * 100)
  const passed = score >= quiz.passingScore

  const breakdown: { [category: string]: { correct: number; total: number; percentage: number } } = {}
  for (const [category, data] of Object.entries(categoryBreakdown)) {
    breakdown[category] = {
      ...data,
      percentage: Math.round((data.correct / data.total) * 100),
    }
  }

  let feedback = ""
  if (passed) {
    if (score >= 95) {
      feedback = "Outstanding performance! You demonstrated exceptional mastery of the subject matter."
    } else if (score >= 90) {
      feedback = "Excellent work! You have a strong understanding of the key concepts."
    } else {
      feedback = "Good job! You passed the assessment and showed solid understanding."
    }
  } else {
    feedback = `You scored ${score}%, which is below the passing threshold of ${quiz.passingScore}%. Review the areas where you struggled and try again.`
  }

  return { score, passed, feedback, breakdown }
}

export function generateAdaptiveQuestion(quiz: Quiz, previousResponses: QuizResponse[]): Question | null {
  if (!quiz.isAdaptive || previousResponses.length === 0) {
    return null
  }

  const averagePerformance =
    previousResponses.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / previousResponses.length

  let targetDifficulty: "beginner" | "intermediate" | "advanced"
  if (averagePerformance >= 0.8) {
    targetDifficulty = "advanced"
  } else if (averagePerformance >= 0.6) {
    targetDifficulty = "intermediate"
  } else {
    targetDifficulty = "beginner"
  }

  const availableQuestions = quiz.questions.filter(
    (q) => q.difficulty === targetDifficulty && !previousResponses.some((r) => r.questionId === q.id),
  )

  return availableQuestions.length > 0 ? availableQuestions[0] : null
}
