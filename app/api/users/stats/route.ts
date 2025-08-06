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

    // Get user statistics
    const [totalUsers] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization_id = ${user.organization_id}
    `

    const [activeUsers] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization_id = ${user.organization_id}
      AND last_login > NOW() - INTERVAL '30 days'
    `

    const [pendingInvitations] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE organization_id = ${user.organization_id}
      AND status = 'pending'
    `

    return NextResponse.json({
      totalUsers: parseInt(totalUsers.count) || 0,
      activeUsers: parseInt(activeUsers.count) || 0,
      pendingInvitations: parseInt(pendingInvitations.count) || 0,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ 
      totalUsers: 0,
      activeUsers: 0,
      pendingInvitations: 0,
    })
  }
}
