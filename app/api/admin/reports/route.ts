import { createClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/lib/api/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET all reports (admin only)
export async function GET(request: NextRequest) {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get reports with reporter and reported user info
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        created_at,
        reporter:profiles!reports_reporter_id_fkey(user_id, name, avatar_url),
        reported:profiles!reports_reported_user_id_fkey(user_id, name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        reports,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get reports error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}

// DELETE a report (admin only - marks as handled by deleting)
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Delete report error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}
