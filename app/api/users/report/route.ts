import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/ratelimit'

// POST report a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting: max 10 reports per day
    const rateLimit = checkRateLimit(user.id, 'reports', RATE_LIMITS.reports)
    if (!rateLimit.success) {
      return NextResponse.json(rateLimitResponse(rateLimit), { status: 429 })
    }

    const { reportedUserId, reason, description } = await request.json()

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'reportedUserId and reason are required' },
        { status: 400 }
      )
    }

    const validReasons = [
      'inappropriate_behavior',
      'suspicious_activity',
      'fake_profile',
      'harassment',
      'spam',
      'other',
    ]

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    if (reportedUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      )
    }

    // Check if already reported (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_user_id', reportedUserId)
      .gt('created_at', oneDayAgo)
      .single()

    if (recentReport) {
      return NextResponse.json(
        { error: 'You have already reported this user recently' },
        { status: 409 }
      )
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert([
        {
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          description: description || null,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Report submitted', report },
      { status: 201 }
    )
  } catch (error) {
    console.error('Report user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET user's reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { reports },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
