export interface ScenarioStep {
  id: string
  type: "decision" | "information" | "action" | "assessment"
  title: string
  content: string
  options?: ScenarioOption[]
  consequences?: { [key: string]: string }
  nextStep?: string
  timeLimit?: number
  resources?: string[]
}

export interface ScenarioOption {
  id: string
  text: string
  consequence: "positive" | "negative" | "neutral"
  points: number
  feedback: string
  nextStep?: string
}

export interface TrainingScenario {
  id: string
  title: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: number
  learningObjectives: string[]
  steps: ScenarioStep[]
  resources: string[]
  tags: string[]
}

export const SECURITY_AWARENESS_SCENARIOS: TrainingScenario[] = [
  {
    id: "phishing-email-investigation",
    title: "Advanced Phishing Email Investigation",
    description: "Investigate a sophisticated phishing campaign targeting your organization",
    category: "Security Awareness",
    difficulty: "intermediate",
    estimatedTime: 25,
    learningObjectives: [
      "Identify advanced phishing techniques",
      "Analyze email headers and metadata",
      "Implement proper incident response procedures",
      "Coordinate with security team effectively",
    ],
    steps: [
      {
        id: "initial-email",
        type: "information",
        title: "Suspicious Email Received",
        content: `You receive the following email in your inbox:

**From:** security-team@yourcompany.co.uk
**Subject:** URGENT: Security Verification Required - Account Suspension Imminent
**Date:** Today, 9:23 AM

Dear [Your Name],

Our security systems have detected unusual activity on your account. To prevent unauthorized access, we need you to verify your identity immediately.

**Suspicious Activities Detected:**
- Login attempts from unknown IP addresses
- Unusual file access patterns
- Potential data exfiltration attempts

**IMMEDIATE ACTION REQUIRED:**
Click here to verify your account: [Verify Account Now]

If you do not complete verification within 2 hours, your account will be suspended for security purposes.

Best regards,
IT Security Team
Internal Security Division`,
        nextStep: "initial-analysis",
      },
      {
        id: "initial-analysis",
        type: "decision",
        title: "Initial Assessment",
        content: "What is your immediate reaction to this email?",
        options: [
          {
            id: "click-link",
            text: "Click the verification link immediately to prevent account suspension",
            consequence: "negative",
            points: -10,
            feedback:
              "CRITICAL ERROR: Never click suspicious links! This could compromise your credentials and system security.",
            nextStep: "security-breach",
          },
          {
            id: "forward-colleagues",
            text: "Forward to colleagues to warn them about the suspicious email",
            consequence: "negative",
            points: -5,
            feedback: "Poor choice: Forwarding suspicious emails can spread the threat. Report to security instead.",
            nextStep: "spread-threat",
          },
          {
            id: "analyze-carefully",
            text: "Carefully analyze the email for suspicious indicators before taking action",
            consequence: "positive",
            points: 10,
            feedback: "Excellent! Taking time to analyze suspicious communications is the correct first step.",
            nextStep: "detailed-analysis",
          },
          {
            id: "delete-ignore",
            text: "Delete the email and ignore it",
            consequence: "neutral",
            points: 0,
            feedback: "While safe, simply deleting doesn't help protect others or improve security awareness.",
            nextStep: "missed-opportunity",
          },
        ],
      },
      {
        id: "detailed-analysis",
        type: "assessment",
        title: "Email Analysis",
        content: `Now let's analyze this email systematically. Identify the red flags:

**Email Headers:**
- From: security-team@yourcompany.co.uk
- Reply-To: noreply@secure-verification-portal.com
- Return-Path: bounce@marketing-emails.net
- Received: from mail.suspicious-domain.ru

**Content Analysis:**
- Generic greeting using placeholder [Your Name]
- Urgent language creating time pressure
- Threatening consequences (account suspension)
- External link destination: https://secure-account-verify.net/login
- No company branding or official signatures

What are the most significant red flags? (Select all that apply)`,
        options: [
          {
            id: "domain-mismatch",
            text: "Domain mismatch between sender and reply-to addresses",
            consequence: "positive",
            points: 5,
            feedback: "Correct! The sender claims to be from yourcompany.co.uk but replies go to a different domain.",
          },
          {
            id: "foreign-server",
            text: "Email originated from a foreign server (.ru domain)",
            consequence: "positive",
            points: 5,
            feedback:
              "Correct! The email routing shows it came from a Russian server, highly suspicious for internal communications.",
          },
          {
            id: "generic-greeting",
            text: "Generic placeholder greeting instead of personalized message",
            consequence: "positive",
            points: 3,
            feedback: "Good catch! Legitimate internal emails would use your actual name, not a placeholder.",
          },
          {
            id: "urgent-language",
            text: "Urgent language designed to bypass critical thinking",
            consequence: "positive",
            points: 4,
            feedback: "Excellent! Urgency is a classic social engineering tactic to pressure quick decisions.",
          },
          {
            id: "external-link",
            text: "Link redirects to external domain not owned by the company",
            consequence: "positive",
            points: 5,
            feedback: "Critical observation! Company security links should always go to official company domains.",
          },
        ],
        nextStep: "response-plan",
      },
      {
        id: "response-plan",
        type: "decision",
        title: "Incident Response",
        content: "You've identified this as a phishing attempt. What's your next course of action?",
        options: [
          {
            id: "report-security",
            text: "Report to IT security team immediately with full email headers",
            consequence: "positive",
            points: 10,
            feedback: "Perfect! Reporting with complete information helps security teams track and respond to threats.",
            nextStep: "security-coordination",
          },
          {
            id: "warn-team",
            text: "Send a warning to your immediate team about the phishing attempt",
            consequence: "neutral",
            points: 5,
            feedback: "Good intention, but security team should coordinate organization-wide communications.",
            nextStep: "partial-response",
          },
          {
            id: "block-sender",
            text: "Block the sender and delete the email",
            consequence: "neutral",
            points: 3,
            feedback: "This protects you but doesn't help protect others or improve organizational security.",
            nextStep: "individual-protection",
          },
        ],
      },
      {
        id: "security-coordination",
        type: "information",
        title: "Security Team Response",
        content: `Excellent work! The security team confirms this is part of a targeted spear-phishing campaign.

**Investigation Results:**
- 47 employees received similar emails
- 3 employees clicked the malicious link
- Attackers harvested credentials from a recent data breach
- Campaign specifically targeted your organization

**Your Actions Helped:**
- Early detection prevented wider compromise
- Detailed analysis provided crucial threat intelligence
- Proper reporting enabled rapid response

**Security Team Actions:**
- Blocked malicious domains at firewall level
- Reset credentials for affected accounts
- Implemented additional email filtering rules
- Initiated security awareness reminder campaign`,
        nextStep: "lessons-learned",
      },
      {
        id: "lessons-learned",
        type: "assessment",
        title: "Key Takeaways",
        content: "What are the most important lessons from this incident?",
        options: [
          {
            id: "verify-internal",
            text: "Always verify internal communications through alternative channels",
            consequence: "positive",
            points: 5,
            feedback: "When in doubt, verify through phone, in-person, or official company channels.",
          },
          {
            id: "analyze-headers",
            text: "Email header analysis reveals crucial threat intelligence",
            consequence: "positive",
            points: 5,
            feedback: "Correct! Headers often contain the most reliable indicators of email authenticity.",
          },
          {
            id: "report-quickly",
            text: "Quick reporting to security teams enables rapid organizational protection",
            consequence: "positive",
            points: 5,
            feedback: "Excellent! Your quick action helped protect 44 other employees from falling victim.",
          },
          {
            id: "social-engineering",
            text: "Attackers use urgency and fear to bypass logical thinking",
            consequence: "positive",
            points: 4,
            feedback: "Very important! Recognizing psychological manipulation tactics is crucial for security.",
          },
        ],
      },
    ],
    resources: [
      "Email Security Best Practices Guide",
      "Phishing Identification Checklist",
      "Incident Reporting Procedures",
      "Social Engineering Awareness Training",
    ],
    tags: ["phishing", "email-security", "incident-response", "social-engineering"],
  },
  {
    id: "usb-drop-attack",
    title: "USB Drop Attack Response",
    description: "Handle a potential USB-based attack scenario in your workplace",
    category: "Security Awareness",
    difficulty: "beginner",
    estimatedTime: 15,
    learningObjectives: [
      "Recognize USB-based attack vectors",
      "Implement proper physical security procedures",
      "Understand the risks of unknown devices",
      "Follow appropriate reporting protocols",
    ],
    steps: [
      {
        id: "discovery",
        type: "information",
        title: "USB Device Discovery",
        content: `You're walking to your car after work when you notice a USB flash drive on the ground near the employee parking lot. 

The USB drive has a professional-looking label that reads:
"CONFIDENTIAL - Q4 Executive Bonuses & Restructuring Plans"

Several of your colleagues are also leaving work and notice the device. One colleague, Sarah from HR, seems very interested and mentions that she's been wondering about the upcoming restructuring rumors.`,
        nextStep: "initial-reaction",
      },
      {
        id: "initial-reaction",
        type: "decision",
        title: "First Response",
        content: "What's your immediate reaction to finding this USB drive?",
        options: [
          {
            id: "plug-in-check",
            text: "Take it to your computer to see what's on it - it might be important company information",
            consequence: "negative",
            points: -15,
            feedback:
              "CRITICAL ERROR: Never plug unknown USB devices into company systems! This is a common attack vector.",
            nextStep: "malware-infection",
          },
          {
            id: "give-to-sarah",
            text: "Give it to Sarah since she's from HR and might know what to do with it",
            consequence: "negative",
            points: -5,
            feedback:
              "Poor choice: You're potentially exposing a colleague to a security threat without proper verification.",
            nextStep: "colleague-risk",
          },
          {
            id: "secure-and-report",
            text: "Secure the device without connecting it and report it to IT security",
            consequence: "positive",
            points: 10,
            feedback:
              "Excellent! This is the correct procedure for handling unknown devices that could be security threats.",
            nextStep: "proper-handling",
          },
          {
            id: "ignore-leave",
            text: "Leave it where it is - not your problem",
            consequence: "neutral",
            points: -2,
            feedback: "While safe for you, ignoring potential security threats doesn't help protect your organization.",
            nextStep: "missed-prevention",
          },
        ],
      },
      {
        id: "proper-handling",
        type: "information",
        title: "Security Protocol",
        content: `Good decision! You carefully pick up the USB drive without connecting it to any device and contact IT security.

**Security Team Response:**
"Thank you for reporting this. USB drop attacks are increasingly common. We'll analyze this device in our isolated environment."

**Analysis Results (Next Day):**
- Device contained advanced malware designed to steal credentials
- Malware would have provided remote access to company systems  
- Similar devices were found at 3 other locations around the building
- This appears to be a coordinated physical security attack

**Impact of Your Actions:**
- Prevented potential system compromise
- Enabled security team to discover broader attack campaign
- Protected colleagues from falling victim to the same attack`,
        nextStep: "attack-analysis",
      },
      {
        id: "attack-analysis",
        type: "assessment",
        title: "Understanding the Attack",
        content: "Why are USB drop attacks effective? Select the key factors:",
        options: [
          {
            id: "curiosity-factor",
            text: "Human curiosity makes people want to see what's on unknown devices",
            consequence: "positive",
            points: 5,
            feedback: "Correct! Curiosity is a powerful psychological driver that attackers exploit.",
          },
          {
            id: "authority-appearance",
            text: "Professional labeling makes devices appear legitimate and important",
            consequence: "positive",
            points: 5,
            feedback: "Excellent observation! Attackers use official-looking labels to increase credibility.",
          },
          {
            id: "bypass-network",
            text: "Physical attacks can bypass network security controls",
            consequence: "positive",
            points: 5,
            feedback: "Very important! USB attacks circumvent firewalls and network monitoring.",
          },
          {
            id: "autorun-features",
            text: "Many systems automatically execute programs when USB devices are connected",
            consequence: "positive",
            points: 4,
            feedback: "Good point! Autorun features can trigger malware without user interaction.",
          },
        ],
        nextStep: "prevention-measures",
      },
      {
        id: "prevention-measures",
        type: "decision",
        title: "Prevention Strategies",
        content: "What measures should organizations implement to prevent USB-based attacks?",
        options: [
          {
            id: "disable-usb",
            text: "Completely disable all USB ports on company computers",
            consequence: "neutral",
            points: 2,
            feedback:
              "While secure, this may be too restrictive for business operations. Better to use selective controls.",
          },
          {
            id: "employee-training",
            text: "Regular security awareness training about physical security threats",
            consequence: "positive",
            points: 8,
            feedback: "Excellent! Employee education is the most effective defense against social engineering attacks.",
          },
          {
            id: "device-controls",
            text: "Implement USB device controls that only allow approved devices",
            consequence: "positive",
            points: 7,
            feedback: "Great approach! Technical controls can prevent unauthorized devices from functioning.",
          },
          {
            id: "incident-procedures",
            text: "Clear procedures for reporting and handling suspicious devices",
            consequence: "positive",
            points: 6,
            feedback: "Very important! Clear procedures ensure consistent and effective responses to threats.",
          },
        ],
      },
    ],
    resources: [
      "Physical Security Guidelines",
      "USB Security Policy",
      "Incident Reporting Procedures",
      "Social Engineering Defense Training",
    ],
    tags: ["physical-security", "usb-attacks", "social-engineering", "incident-response"],
  },
]

export const INCIDENT_RESPONSE_SCENARIOS: TrainingScenario[] = [
  {
    id: "ransomware-outbreak",
    title: "Ransomware Outbreak Response",
    description: "Lead the response to a major ransomware attack affecting multiple systems",
    category: "Incident Response",
    difficulty: "advanced",
    estimatedTime: 45,
    learningObjectives: [
      "Execute rapid incident response procedures",
      "Coordinate cross-functional response teams",
      "Make critical decisions under pressure",
      "Implement effective containment strategies",
      "Manage stakeholder communications during crisis",
    ],
    steps: [
      {
        id: "initial-alert",
        type: "information",
        title: "Critical Alert Received",
        content: `**URGENT SECURITY ALERT**
Time: 3:47 AM
Source: Automated Monitoring System

**Alert Details:**
- Multiple file encryption events detected across network
- 15 workstations showing signs of ransomware activity
- File extensions being changed to .locked
- Suspicious network traffic to external IP addresses
- Several critical servers showing unusual CPU activity

**Affected Systems:**
- Accounting Department (8 workstations)
- HR Department (4 workstations) 
- File Server FS-01 (contains customer data)
- Email Server (showing signs of lateral movement)
- Backup Server (connection attempts detected)

**Current Status:**
- Attack appears to be spreading
- Users starting to arrive for work in 4 hours
- No ransom note detected yet
- Network monitoring shows continued malicious activity`,
        nextStep: "immediate-response",
      },
      {
        id: "immediate-response",
        type: "decision",
        title: "Immediate Response Decision",
        content: "You're the incident response lead. What's your first priority?",
        timeLimit: 120,
        options: [
          {
            id: "isolate-network",
            text: "Immediately isolate affected systems from the network to prevent spread",
            consequence: "positive",
            points: 15,
            feedback: "Excellent! Containment is the top priority to prevent further damage.",
            nextStep: "containment-strategy",
          },
          {
            id: "call-everyone",
            text: "Call all department heads and executives to inform them of the situation",
            consequence: "neutral",
            points: 5,
            feedback: "Communication is important, but containment should be the immediate priority.",
            nextStep: "delayed-containment",
          },
          {
            id: "investigate-first",
            text: "Investigate the attack vector before taking containment actions",
            consequence: "negative",
            points: -5,
            feedback: "Investigation is important but secondary to stopping the spread. Time is critical.",
            nextStep: "continued-spread",
          },
          {
            id: "restore-backups",
            text: "Begin restoring systems from backups immediately",
            consequence: "negative",
            points: -10,
            feedback: "Dangerous! Restoring without containment could reinfect clean systems.",
            nextStep: "reinfection-risk",
          },
        ],
      },
      {
        id: "containment-strategy",
        type: "decision",
        title: "Containment Implementation",
        content: `Good decision! You've initiated containment procedures.

**Current Situation:**
- Network isolation in progress
- 15 confirmed infected workstations
- File server showing encryption activity
- Email server potentially compromised
- Backup server connection blocked

**Containment Options:**
How do you implement containment while minimizing business impact?`,
        options: [
          {
            id: "full-shutdown",
            text: "Shut down entire network infrastructure immediately",
            consequence: "neutral",
            points: 5,
            feedback: "Effective for containment but may cause unnecessary business disruption.",
            nextStep: "business-impact",
          },
          {
            id: "selective-isolation",
            text: "Selectively isolate infected systems while maintaining critical business functions",
            consequence: "positive",
            points: 12,
            feedback: "Excellent balance of security and business continuity!",
            nextStep: "balanced-response",
          },
          {
            id: "monitor-only",
            text: "Monitor the situation closely but avoid disrupting business operations",
            consequence: "negative",
            points: -8,
            feedback: "Too risky! Active containment is necessary to prevent further damage.",
            nextStep: "escalated-damage",
          },
        ],
      },
      {
        id: "balanced-response",
        type: "information",
        title: "Containment Success",
        content: `Excellent containment strategy! Your selective approach has been effective:

**Containment Results:**
- All infected workstations isolated from network
- File server disconnected and secured
- Email server isolated but core email functionality maintained via backup
- Critical business systems remain operational
- Malware spread successfully halted

**Current Assessment:**
- 23 systems confirmed infected (spread stopped)
- Customer data on file server encrypted but contained
- Email compromise limited to 3 user accounts
- Backup systems remain clean and accessible
- Business operations can continue with reduced capacity

**Next Phase:**
The immediate threat is contained. Now you need to coordinate the full response effort.`,
        nextStep: "team-coordination",
      },
      {
        id: "team-coordination",
        type: "decision",
        title: "Response Team Assembly",
        content: "Who should be part of your incident response team for this ransomware attack?",
        options: [
          {
            id: "it-only",
            text: "Keep it small - just IT security and systems administrators",
            consequence: "negative",
            points: -5,
            feedback: "Too limited! Ransomware incidents require broader organizational coordination.",
            nextStep: "insufficient-coordination",
          },
          {
            id: "everyone",
            text: "Include all department heads and senior management",
            consequence: "negative",
            points: -3,
            feedback: "Too many people can slow decision-making. Focus on essential roles.",
            nextStep: "coordination-chaos",
          },
          {
            id: "core-team",
            text: "Assemble core team: IT Security, Legal, Communications, Executive Sponsor, HR",
            consequence: "positive",
            points: 10,
            feedback: "Perfect! This covers all essential functions for comprehensive incident response.",
            nextStep: "effective-coordination",
          },
          {
            id: "external-help",
            text: "Immediately bring in external incident response consultants",
            consequence: "neutral",
            points: 3,
            feedback: "May be helpful later, but internal team should lead initial response.",
            nextStep: "external-dependency",
          },
        ],
      },
      {
        id: "effective-coordination",
        type: "assessment",
        title: "Response Coordination",
        content: `Your core response team is assembled and working effectively:

**Team Roles:**
- **You (IR Lead):** Overall coordination and technical decisions
- **IT Security:** Technical analysis and forensics
- **Legal Counsel:** Regulatory compliance and law enforcement liaison
- **Communications:** Internal and external messaging
- **Executive Sponsor:** Business decisions and resource authorization
- **HR:** Employee communications and support

**Current Priorities:**
What should be the team's immediate focus areas? (Select top 3)`,
        options: [
          {
            id: "forensic-analysis",
            text: "Detailed forensic analysis to understand attack vector and scope",
            consequence: "positive",
            points: 8,
            feedback: "Critical for understanding the full impact and preventing reoccurrence.",
          },
          {
            id: "data-assessment",
            text: "Assess what data was compromised and notification requirements",
            consequence: "positive",
            points: 9,
            feedback: "Essential for regulatory compliance and customer protection.",
          },
          {
            id: "recovery-planning",
            text: "Develop comprehensive system recovery and restoration plan",
            consequence: "positive",
            points: 8,
            feedback: "Important for business continuity and minimizing downtime.",
          },
          {
            id: "ransom-negotiation",
            text: "Prepare for potential ransom payment negotiations",
            consequence: "neutral",
            points: 2,
            feedback: "Generally not recommended. Focus on recovery from backups and prevention.",
          },
          {
            id: "media-response",
            text: "Prepare public relations response for potential media attention",
            consequence: "neutral",
            points: 4,
            feedback: "Important but secondary to technical response and legal compliance.",
          },
        ],
        nextStep: "recovery-decision",
      },
      {
        id: "recovery-decision",
        type: "decision",
        title: "Recovery Strategy",
        content: `**Recovery Assessment:**
- Clean backups available for most systems (24 hours old)
- Customer database backup is 48 hours old
- Email system can be restored from this morning's backup
- 2 days of work may be lost from affected workstations

**Ransom Note Received:**
"Your files are encrypted. Pay 50 Bitcoin ($2.1M) within 72 hours for decryption key. No payment = permanent data loss."

**Recovery Options:**`,
        options: [
          {
            id: "pay-ransom",
            text: "Pay the ransom to get immediate access to encrypted data",
            consequence: "negative",
            points: -15,
            feedback: "Never recommended! Paying encourages more attacks and doesn't guarantee data recovery.",
            nextStep: "ransom-consequences",
          },
          {
            id: "backup-recovery",
            text: "Restore all systems from clean backups and accept the data loss",
            consequence: "positive",
            points: 12,
            feedback: "Correct approach! Clean restoration is safer and more reliable than ransom payment.",
            nextStep: "clean-recovery",
          },
          {
            id: "hybrid-approach",
            text: "Restore from backups but also attempt to decrypt some critical files",
            consequence: "neutral",
            points: 5,
            feedback: "Risky approach. Focus on clean recovery to ensure no residual malware.",
            nextStep: "complex-recovery",
          },
          {
            id: "wait-and-see",
            text: "Wait to see if security researchers develop free decryption tools",
            consequence: "negative",
            points: -8,
            feedback: "Too risky and uncertain. Business needs require prompt recovery action.",
            nextStep: "prolonged-downtime",
          },
        ],
      },
      {
        id: "clean-recovery",
        type: "information",
        title: "Recovery Success",
        content: `Excellent decision! Your clean recovery approach has been successful:

**Recovery Results:**
- All systems restored from clean backups within 18 hours
- No residual malware detected in restored environment
- Business operations resumed with minimal data loss
- Enhanced security measures implemented during restoration

**Lessons Learned:**
- Backup strategy proved effective for rapid recovery
- Network segmentation limited attack spread
- Incident response team coordination was excellent
- Employee training helped with early detection

**Final Impact:**
- 2 days of recent work lost (acceptable business impact)
- No ransom payment made (saved $2.1M)
- Customer data protected (no breach notification required)
- Stronger security posture implemented

**Your Leadership:**
Your decisive containment actions and recovery strategy minimized damage and demonstrated excellent incident response leadership.`,
        nextStep: "post-incident",
      },
      {
        id: "post-incident",
        type: "assessment",
        title: "Post-Incident Analysis",
        content: "What are the key improvements needed based on this incident?",
        options: [
          {
            id: "backup-frequency",
            text: "Increase backup frequency to minimize data loss in future incidents",
            consequence: "positive",
            points: 6,
            feedback: "Good improvement! More frequent backups reduce recovery point objectives.",
          },
          {
            id: "network-segmentation",
            text: "Implement additional network segmentation to limit attack spread",
            consequence: "positive",
            points: 7,
            feedback: "Excellent! Better segmentation is one of the most effective containment strategies.",
          },
          {
            id: "employee-training",
            text: "Enhanced security awareness training to prevent initial compromise",
            consequence: "positive",
            points: 8,
            feedback: "Critical! Most ransomware attacks start with human error - training is essential.",
          },
          {
            id: "detection-tools",
            text: "Deploy advanced threat detection tools for earlier warning",
            consequence: "positive",
            points: 6,
            feedback: "Important! Earlier detection enables faster response and less damage.",
          },
        ],
      },
    ],
    resources: [
      "NIST Incident Response Framework",
      "Ransomware Response Playbook",
      "Business Continuity Planning Guide",
      "Crisis Communication Templates",
    ],
    tags: ["ransomware", "incident-response", "crisis-management", "business-continuity"],
  },
]

export const AI_ETHICS_SCENARIOS: TrainingScenario[] = [
  {
    id: "biased-hiring-algorithm",
    title: "Biased AI Hiring System",
    description: "Address bias discovered in an AI-powered hiring system",
    category: "AI Ethics & Safety",
    difficulty: "intermediate",
    estimatedTime: 30,
    learningObjectives: [
      "Identify algorithmic bias in AI systems",
      "Understand fairness metrics and evaluation methods",
      "Implement bias mitigation strategies",
      "Balance efficiency with ethical considerations",
    ],
    steps: [
      {
        id: "bias-discovery",
        type: "information",
        title: "Bias Discovery",
        content: `Your company has been using an AI-powered resume screening system for 6 months. The system was trained on historical hiring data and has been automatically filtering candidates for technical positions.

**Performance Metrics:**
- Processing time reduced by 75%
- HR team efficiency increased significantly
- Candidate satisfaction with faster response times

**Concerning Discovery:**
A data analyst noticed troubling patterns in the hiring data:

**Demographic Analysis:**
- Female candidates: 23% pass rate
- Male candidates: 67% pass rate
- Candidates with "foreign" names: 31% pass rate
- Candidates with "traditional" names: 58% pass rate

**Historical Context:**
Your company's technical teams have historically been 80% male, and the training data reflects this historical composition.`,
        nextStep: "initial-assessment",
      },
      {
        id: "initial-assessment",
        type: "decision",
        title: "Initial Response",
        content: "How do you initially respond to this bias discovery?",
        options: [
          {
            id: "continue-system",
            text: "Continue using the system - it's just reflecting historical patterns",
            consequence: "negative",
            points: -15,
            feedback: "Unacceptable! Perpetuating historical bias violates ethical principles and may be illegal.",
            nextStep: "ethical-violation",
          },
          {
            id: "immediate-shutdown",
            text: "Immediately shut down the AI system and return to manual screening",
            consequence: "neutral",
            points: 5,
            feedback: "Safe but reactive. A more systematic approach would be better.",
            nextStep: "system-shutdown",
          },
          {
            id: "thorough-investigation",
            text: "Conduct thorough bias analysis while temporarily suspending automated decisions",
            consequence: "positive",
            points: 12,
            feedback: "Excellent! Systematic investigation while protecting candidates is the right approach.",
            nextStep: "bias-analysis",
          },
          {
            id: "adjust-thresholds",
            text: "Quickly adjust the system thresholds to equalize pass rates",
            consequence: "negative",
            points: -5,
            feedback: "Superficial fix that doesn't address root causes and may create new problems.",
            nextStep: "surface-fix",
          },
        ],
      },
      {
        id: "bias-analysis",
        type: "assessment",
        title: "Comprehensive Bias Analysis",
        content: `Your team conducts a thorough analysis of the AI system:

**Technical Analysis:**
- Model trained on 5 years of historical hiring data
- Features include: education, experience, skills, previous companies
- No explicit demographic features used
- However, proxy features (school names, previous companies) correlate with demographics

**Bias Sources Identified:**
1. **Historical Bias:** Training data reflects past discriminatory practices
2. **Proxy Discrimination:** Seemingly neutral features correlate with protected characteristics
3. **Feedback Loops:** System reinforces existing patterns

**Impact Assessment:**
- 847 potentially qualified candidates rejected due to bias
- Legal risk for discriminatory hiring practices
- Reputational damage if discovered publicly
- Missed opportunity for diverse talent acquisition

What are the most critical bias sources to address? (Select all that apply)`,
        options: [
          {
            id: "training-data",
            text: "Historical training data that reflects past discrimination",
            consequence: "positive",
            points: 8,
            feedback: "Critical insight! Biased training data is often the primary source of algorithmic bias.",
          },
          {
            id: "proxy-features",
            text: "Features that serve as proxies for protected characteristics",
            consequence: "positive",
            points: 8,
            feedback: "Excellent! Proxy discrimination is subtle but very impactful.",
          },
          {
            id: "feedback-loops",
            text: "System reinforcing and amplifying existing biases over time",
            consequence: "positive",
            points: 7,
            feedback: "Important! Feedback loops can make bias worse over time.",
          },
          {
            id: "evaluation-metrics",
            text: "Lack of fairness metrics in model evaluation process",
            consequence: "positive",
            points: 6,
            feedback: "Good point! Fairness should be measured and monitored continuously.",
          },
        ],
        nextStep: "mitigation-strategy",
      },
      {
        id: "mitigation-strategy",
        type: "decision",
        title: "Bias Mitigation Approach",
        content: "What's your comprehensive strategy for addressing the bias?",
        options: [
          {
            id: "retrain-balanced",
            text: "Retrain the model with artificially balanced demographic representation",
            consequence: "neutral",
            points: 4,
            feedback: "Partial solution but may not address underlying feature bias.",
            nextStep: "artificial-balance",
          },
          {
            id: "remove-proxy-features",
            text: "Remove all features that could serve as demographic proxies",
            consequence: "neutral",
            points: 6,
            feedback: "Helpful but may reduce model effectiveness and miss subtle proxies.",
            nextStep: "feature-removal",
          },
          {
            id: "fairness-constraints",
            text: "Implement fairness constraints and multi-objective optimization",
            consequence: "positive",
            points: 12,
            feedback: "Excellent! Technical fairness constraints with business objectives is best practice.",
            nextStep: "fairness-implementation",
          },
          {
            id: "human-ai-hybrid",
            text: "Create human-AI hybrid system with bias monitoring and human oversight",
            consequence: "positive",
            points: 10,
            feedback: "Great approach! Combining AI efficiency with human judgment and oversight.",
            nextStep: "hybrid-system",
          },
        ],
      },
      {
        id: "fairness-implementation",
        type: "information",
        title: "Fairness Implementation",
        content: `Excellent choice! Your team implements a comprehensive fairness framework:

**Technical Implementation:**
- **Fairness Metrics:** Demographic parity, equalized odds, calibration
- **Multi-objective Optimization:** Balance accuracy with fairness constraints
- **Bias Testing:** Regular evaluation across demographic groups
- **Explainability:** Clear reasoning for all decisions

**Process Changes:**
- **Diverse Training Data:** Actively seek diverse, high-quality candidates for training
- **Feature Engineering:** Remove or transform proxy features
- **Continuous Monitoring:** Real-time bias detection and alerting
- **Human Oversight:** Final decisions reviewed by trained humans

**Results After 3 Months:**
- Female candidate pass rate: 58% (up from 23%)
- Male candidate pass rate: 61% (down from 67%)
- Foreign name pass rate: 55% (up from 31%)
- Traditional name pass rate: 59% (down from 58%)
- Overall hiring quality maintained
- Increased diversity in technical teams`,
        nextStep: "ongoing-challenges",
      },
      {
        id: "ongoing-challenges",
        type: "assessment",
        title: "Ongoing Ethical Considerations",
        content: "What ongoing challenges must you address to maintain ethical AI hiring?",
        options: [
          {
            id: "continuous-monitoring",
            text: "Implement continuous bias monitoring and regular model audits",
            consequence: "positive",
            points: 8,
            feedback: "Essential! Bias can emerge over time and must be continuously monitored.",
          },
          {
            id: "stakeholder-education",
            text: "Educate hiring managers and HR staff about AI bias and fairness",
            consequence: "positive",
            points: 7,
            feedback: "Critical! Human oversight requires understanding of bias and fairness principles.",
          },
          {
            id: "transparency-candidates",
            text: "Provide transparency to candidates about AI use in hiring process",
            consequence: "positive",
            points: 6,
            feedback: "Important for trust and may be legally required in some jurisdictions.",
          },
          {
            id: "industry-standards",
            text: "Participate in developing industry standards for ethical AI hiring",
            consequence: "positive",
            points: 5,
            feedback: "Valuable! Industry collaboration helps establish best practices and standards.",
          },
        ],
      },
    ],
    resources: [
      "AI Fairness Guidelines",
      "Algorithmic Bias Detection Tools",
      "Ethical AI Implementation Framework",
      "Legal Compliance for AI Hiring",
    ],
    tags: ["ai-bias", "fairness", "hiring", "algorithmic-accountability"],
  },
]

export function getScenariosByCategory(category: string): TrainingScenario[] {
  switch (category) {
    case "Security Awareness":
      return SECURITY_AWARENESS_SCENARIOS
    case "Incident Response":
      return INCIDENT_RESPONSE_SCENARIOS
    case "AI Ethics & Safety":
      return AI_ETHICS_SCENARIOS
    default:
      return []
  }
}

export function getScenarioById(id: string): TrainingScenario | undefined {
  const allScenarios = [...SECURITY_AWARENESS_SCENARIOS, ...INCIDENT_RESPONSE_SCENARIOS, ...AI_ETHICS_SCENARIOS]
  return allScenarios.find((scenario) => scenario.id === id)
}
