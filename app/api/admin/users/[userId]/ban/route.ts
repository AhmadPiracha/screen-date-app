import { createClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/lib/api/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST ban a user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await checkAdminAccess()

    const { userId } = await params
    const supabase = await createClient()
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      )
    }

    // Update user profile to mark as banned
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        status: 'banned',
        ban_reason: reason,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'User banned', profile },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Ban user error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}

// DELETE unban a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await checkAdminAccess()

    const { userId } = await params
    const supabase = await createClient()

    // Update user profile to unban
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        ban_reason: null,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'User unbanned', profile },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Unban user error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}
