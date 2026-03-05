import { createClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/lib/api/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET analytics dashboard (admin only)
export async function GET(request: NextRequest) {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total matches
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    // Get total reports
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    // Get active users (created in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', sevenDaysAgo)

    // Get total blocked users
    const { count: blockedUsers } = await supabase
      .from('blocked_users')
      .select('*', { count: 'exact', head: true })

    // Get movies in database
    const { count: totalMovies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json(
      {
        analytics: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalMatches: totalMatches || 0,
          totalMessages: totalMessages || 0,
          totalReports: totalReports || 0,
          blockedUsers: blockedUsers || 0,
          totalMovies: totalMovies || 0,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get analytics error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}
