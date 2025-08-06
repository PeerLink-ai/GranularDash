import { NextRequest, NextResponse } from 'next/server'
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

    const users = await sql`
      SELECT id, email, name, role, status, created_at, last_login
      FROM users 
      WHERE organization_id = ${user.organization_id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ users: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, role } = await request.json()

    const [newUser] = await sql`
      INSERT INTO users (email, name, role, organization_id, status)
      VALUES (${email}, ${name}, ${role}, ${user.organization_id}, 'pending')
      RETURNING id, email, name, role, status, created_at
    `

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
