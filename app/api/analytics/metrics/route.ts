import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic metrics with fallbacks
    const metrics = await Promise.all([
      // Total agents
      sql`
        SELECT COUNT(*) as count 
        FROM connected_agents 
        WHERE organization_id = ${user.organization_id}
      `.catch(() => [{ count: '0' }]),
      
      // Active agents
      sql`
        SELECT COUNT(*) as count 
        FROM connected_agents 
        WHERE organization_id = ${user.organization_id}
        AND status = 'active'
      `.catch(() => [{ count: '0' }]),
      
      // Policy violations
      sql`
        SELECT COUNT(*) as count 
        FROM policy_violations 
        WHERE organization_id = ${user.organization_id}
        AND created_at > NOW() - INTERVAL '30 days'
      `.catch(() => [{ count: '0' }]),
      
      // Security threats
      sql`
        SELECT COUNT(*) as count 
        FROM security_threats 
        WHERE organization_id = ${user.organization_id}
        AND status = 'active'
      `.catch(() => [{ count: '0' }])
    ])

    return NextResponse.json({
      totalAgents: parseInt(metrics[0][0]?.count) || 0,
      activeAgents: parseInt(metrics[1][0]?.count) || 0,
      policyViolations: parseInt(metrics[2][0]?.count) || 0,
      securityThreats: parseInt(metrics[3][0]?.count) || 0,
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json({
      totalAgents: 0,
      activeAgents: 0,
      policyViolations: 0,
      securityThreats: 0,
    })
  }
}
