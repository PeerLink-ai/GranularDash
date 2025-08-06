import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock top products data
    const topProducts = [
      { name: 'AI Agent Monitor Pro', sales: 1234, revenue: 45000 },
      { name: 'Compliance Suite', sales: 987, revenue: 38000 },
      { name: 'Security Dashboard', sales: 756, revenue: 29000 },
      { name: 'Analytics Platform', sales: 543, revenue: 22000 },
    ]

    return NextResponse.json({ data: topProducts })
  } catch (error) {
    console.error('Top products error:', error)
    return NextResponse.json({ data: [] })
  }
}
