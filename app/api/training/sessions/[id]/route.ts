import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`
      SELECT u.id, u.email, u.organization 
      FROM users u
      JOIN user_sessions s ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      LIMIT 1
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]
    const sessionId = params.id

    const sessionResult = await sql`
      SELECT 
        ts.id,
        ts.simulation_id,
        ts.started_at,
        ts.status,
        sim.name as simulation_name,
        sim.type,
        sim.difficulty_level,
        sim.duration_minutes,
        sim.pass_threshold,
        sim.configuration
      FROM training_sessions ts
      JOIN training_simulations sim ON sim.id = ts.simulation_id
      WHERE ts.id = ${sessionId} 
      AND ts.organization_id = ${user.organization}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult[0]

    const scenarios = generateTrainingScenarios(session.type, session.difficulty_level)

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        simulationId: session.simulation_id,
        simulationName: session.simulation_name,
        type: session.type,
        difficulty: session.difficulty_level,
        scenarios,
        estimatedDuration: session.duration_minutes || 60,
        passThreshold: session.pass_threshold || 80,
      },
    })
  } catch (error) {
    console.error("Get training session error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get session",
      },
      { status: 500 },
    )
  }
}

function generateTrainingScenarios(type: string, difficulty: string) {
  const scenarioLibrary = {
    "Security Awareness": {
      beginner: [
        {
          id: 1,
          title: "Phishing Email Detection",
          description: "Identify suspicious elements in email communications",
          weight: 0.3,
          type: "multiple_choice",
          content: {
            question:
              "You receive an email claiming to be from your bank asking you to verify your account. Which red flags indicate this might be phishing?",
            options: [
              "Generic greeting like 'Dear Customer'",
              "Urgent language demanding immediate action",
              "Suspicious sender email address",
              "All of the above",
            ],
            correct: 3,
          },
        },
        {
          id: 2,
          title: "Password Security Scenario",
          description: "Apply password best practices in real situations",
          weight: 0.4,
          type: "scenario_response",
          content: {
            scenario:
              "Your colleague asks you to share your login credentials so they can access a shared system while you're on vacation. How do you handle this request professionally while maintaining security?",
          },
        },
        {
          id: 3,
          title: "Safe Browsing Practices",
          description: "Recognize and avoid malicious websites",
          weight: 0.3,
          type: "hands_on",
          content: {
            instructions: "Examine the following website characteristics and determine if they're trustworthy",
            steps: [
              "Check the URL for spelling errors or suspicious domains",
              "Look for HTTPS encryption (lock icon)",
              "Verify contact information and company details",
              "Check for professional design and grammar",
            ],
          },
        },
      ],
      intermediate: [
        {
          id: 1,
          title: "Spear Phishing Analysis",
          description: "Detect targeted phishing attacks with personalized content",
          weight: 0.25,
          type: "scenario_response",
          content: {
            scenario:
              "You receive an email that appears to be from your CEO asking you to urgently purchase gift cards for a client meeting. The email includes specific details about recent company projects. How do you verify this request?",
          },
        },
        {
          id: 2,
          title: "Social Engineering Call",
          description: "Handle suspicious phone calls requesting sensitive information",
          weight: 0.25,
          type: "multiple_choice",
          content: {
            question:
              "Someone calls claiming to be from IT support, asking for your password to 'update security settings.' What's your best response?",
            options: [
              "Provide the password since they're from IT",
              "Ask for their employee ID and call back through official channels",
              "Hang up immediately without explanation",
              "Give them a fake password to test them",
            ],
            correct: 1,
          },
        },
        {
          id: 3,
          title: "USB Security Incident",
          description: "Respond appropriately to found USB devices",
          weight: 0.25,
          type: "scenario_response",
          content: {
            scenario:
              "You find a USB drive in the parking lot labeled 'Confidential - Q4 Bonuses.' Several colleagues are curious about its contents. What steps do you take?",
          },
        },
        {
          id: 4,
          title: "Email Spoofing Detection",
          description: "Identify sophisticated email spoofing attempts",
          weight: 0.25,
          type: "hands_on",
          content: {
            instructions: "Analyze email headers and sender information to detect spoofing",
            steps: [
              "Examine the 'From' field vs. actual sender address",
              "Check email headers for routing inconsistencies",
              "Verify sender reputation and domain age",
              "Look for display name spoofing techniques",
            ],
          },
        },
      ],
      advanced: [
        {
          id: 1,
          title: "Advanced Persistent Threat Indicators",
          description: "Recognize sophisticated, long-term attack patterns",
          weight: 0.2,
          type: "document",
          content: {
            title: "APT Case Study: Operation CloudHopper",
            content:
              "Advanced Persistent Threats (APTs) are sophisticated, long-term cyberattacks typically sponsored by nation-states or organized crime groups.\n\nKey characteristics include:\n- Stealthy infiltration and persistence\n- Multiple attack vectors and tools\n- Focus on high-value targets and data\n- Extended dwell time in networks\n\nThe CloudHopper campaign targeted managed service providers to gain access to their clients' networks, demonstrating the supply chain attack methodology commonly used by APT groups.",
          },
        },
        {
          id: 2,
          title: "Business Email Compromise Investigation",
          description: "Analyze and respond to sophisticated BEC attacks",
          weight: 0.2,
          type: "scenario_response",
          content: {
            scenario:
              "Your finance team reports they wired $50,000 to a vendor based on an email request. Later investigation reveals the email came from a compromised account of a legitimate business partner. The attack involved months of email monitoring before the fraudulent request. How do you investigate and respond?",
          },
        },
        {
          id: 3,
          title: "Supply Chain Security Assessment",
          description: "Evaluate third-party security risks and vulnerabilities",
          weight: 0.2,
          type: "hands_on",
          content: {
            instructions: "Conduct a security assessment of a critical vendor relationship",
            steps: [
              "Review vendor security certifications and compliance",
              "Assess data access and handling procedures",
              "Evaluate incident response and breach notification processes",
              "Analyze contractual security requirements and SLAs",
              "Perform risk scoring and mitigation planning",
            ],
          },
        },
        {
          id: 4,
          title: "Zero-Day Threat Response",
          description: "Develop response strategies for unknown threats",
          weight: 0.2,
          type: "scenario_response",
          content: {
            scenario:
              "Your security monitoring detects unusual network traffic patterns and file modifications that don't match any known threat signatures. Preliminary analysis suggests a potential zero-day exploit. How do you coordinate investigation and response while maintaining business operations?",
          },
        },
        {
          id: 5,
          title: "Threat Intelligence Integration",
          description: "Apply threat intelligence to improve security posture",
          weight: 0.2,
          type: "video",
          content: {
            title: "Threat Intelligence Lifecycle and Application",
            duration: 15,
            description: "Learn how to collect, analyze, and operationalize threat intelligence",
          },
        },
      ],
    },
    "Incident Response": {
      beginner: [
        {
          id: 1,
          title: "Incident Classification",
          description: "Properly categorize security incidents by severity and type",
          weight: 0.4,
          type: "multiple_choice",
          content: {
            question:
              "A user reports their computer is running slowly and displaying pop-up ads. How would you classify this incident?",
            options: [
              "Critical - System compromise",
              "High - Malware infection",
              "Medium - Performance issue",
              "Low - User error",
            ],
            correct: 1,
          },
        },
        {
          id: 2,
          title: "Initial Response Procedures",
          description: "Execute proper first response steps for security incidents",
          weight: 0.6,
          type: "scenario_response",
          content: {
            scenario:
              "You're the first responder to a suspected data breach. An employee reports that customer data may have been accessed by an unauthorized person. What are your immediate first steps?",
          },
        },
      ],
      intermediate: [
        {
          id: 1,
          title: "Containment Strategy Development",
          description: "Design effective containment measures for different incident types",
          weight: 0.3,
          type: "scenario_response",
          content: {
            scenario:
              "A ransomware attack has encrypted files on 15 workstations across 3 departments. The malware is still spreading through the network. Design a containment strategy that minimizes business disruption while stopping the attack.",
          },
        },
        {
          id: 2,
          title: "Digital Evidence Preservation",
          description: "Properly collect and preserve digital evidence",
          weight: 0.3,
          type: "hands_on",
          content: {
            instructions: "Follow proper evidence collection procedures for a compromised system",
            steps: [
              "Document the current state with photographs/screenshots",
              "Create forensic images of affected systems",
              "Maintain chain of custody documentation",
              "Preserve volatile memory and network connections",
              "Secure physical access to evidence",
            ],
          },
        },
        {
          id: 3,
          title: "Stakeholder Communication",
          description: "Coordinate effective incident communications",
          weight: 0.4,
          type: "scenario_response",
          content: {
            scenario:
              "During a security incident affecting customer data, you need to communicate with: executive leadership, legal team, customers, regulatory bodies, and media. Draft a communication timeline and key messages for each stakeholder group.",
          },
        },
      ],
      advanced: [
        {
          id: 1,
          title: "Complex Multi-Vector Attack Response",
          description: "Coordinate response to sophisticated, multi-stage attacks",
          weight: 0.25,
          type: "scenario_response",
          content: {
            scenario:
              "Your organization is experiencing a coordinated attack involving: initial phishing emails, lateral movement through compromised credentials, data exfiltration to external servers, and DDoS attacks on public-facing services. Multiple business units are affected. How do you coordinate the response across all attack vectors?",
          },
        },
        {
          id: 2,
          title: "Advanced Forensic Analysis",
          description: "Conduct detailed forensic investigation of complex incidents",
          weight: 0.25,
          type: "hands_on",
          content: {
            instructions: "Perform advanced forensic analysis on a compromised system",
            steps: [
              "Analyze system logs and event timelines",
              "Examine network traffic patterns and communications",
              "Investigate file system artifacts and deleted data",
              "Correlate indicators across multiple systems",
              "Reconstruct attack timeline and methodology",
            ],
          },
        },
        {
          id: 3,
          title: "Business Continuity Integration",
          description: "Integrate incident response with business continuity planning",
          weight: 0.25,
          type: "document",
          content: {
            title: "Incident Response and Business Continuity Integration",
            content:
              "Effective incident response must be closely integrated with business continuity and disaster recovery planning.\n\nKey integration points include:\n- Critical system identification and prioritization\n- Recovery time and point objectives (RTO/RPO)\n- Alternative operational procedures\n- Communication and decision-making authorities\n- Resource allocation and vendor coordination\n\nThe goal is to maintain essential business functions while containing and resolving security incidents.",
          },
        },
        {
          id: 4,
          title: "Post-Incident Analysis and Improvement",
          description: "Conduct thorough post-incident reviews and implement improvements",
          weight: 0.25,
          type: "scenario_response",
          content: {
            scenario:
              "Following a major security incident that lasted 72 hours and affected 40% of your systems, you need to conduct a comprehensive post-incident review. The incident revealed gaps in detection capabilities, communication procedures, and recovery processes. How do you structure the review and implement lasting improvements?",
          },
        },
      ],
    },
  }

  return scenarioLibrary[type]?.[difficulty] || scenarioLibrary["Security Awareness"]["intermediate"]
}
