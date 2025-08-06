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

    // Get policy metrics with fallbacks
    const metrics = await Promise.all([
      // Total policies
      sql`
        SELECT COUNT(*) as count 
        FROM policies 
        WHERE organization_id = ${user.organization_id}
      `.catch(() => [{ count: '0' }]),
      
      // Active policies
      sql`
        SELECT COUNT(*) as count 
        FROM policies 
        WHERE organization_id = ${user.organization_id}
        AND status = 'active'
      `.catch(() => [{ count: '0' }]),
      
      // Recent violations
      sql`
        SELECT COUNT(*) as count 
        FROM policy_violations 
        WHERE organization_id = ${user.organization_id}
        AND created_at > NOW() - INTERVAL '7 days'
      `.catch(() => [{ count: '0' }])
    ])

    return NextResponse.json({
      totalPolicies: parseInt(metrics[0][0]?.count) || 0,
      activePolicies: parseInt(metrics[1][0]?.count) || 0,
      recentViolations: parseInt(metrics[2][0]?.count) || 0,
    })
  } catch (error) {
    console.error('Error fetching policy metrics:', error)
    return NextResponse.json({
      totalPolicies: 0,
      activePolicies: 0,
      recentViolations: 0,
    })
  }
}
