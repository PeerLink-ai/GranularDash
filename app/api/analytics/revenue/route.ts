import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock revenue data since we don't have transactions table
    const revenueData = [
      { month: 'Jan', revenue: 45000 },
      { month: 'Feb', revenue: 52000 },
      { month: 'Mar', revenue: 48000 },
      { month: 'Apr', revenue: 61000 },
      { month: 'May', revenue: 55000 },
      { month: 'Jun', revenue: 67000 },
    ]

    return NextResponse.json({ data: revenueData })
  } catch (error) {
    console.error('Revenue data error:', error)
    return NextResponse.json({ data: [] })
  }
}
