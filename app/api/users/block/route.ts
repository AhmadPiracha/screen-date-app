import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST block a user
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

    const { blockedUserId } = await request.json()

    if (!blockedUserId) {
      return NextResponse.json(
        { error: 'blockedUserId is required' },
        { status: 400 }
      )
    }

    if (blockedUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      )
    }

    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_user_id', blockedUserId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 409 }
      )
    }

    // Block the user
    const { data: blocked, error } = await supabase
      .from('blocked_users')
      .insert([
        {
          blocker_id: user.id,
          blocked_user_id: blockedUserId,
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

    return NextResponse.json(blocked, { status: 201 })
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE unblock a user
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const blockedUserId = searchParams.get('blockedUserId')

    if (!blockedUserId) {
      return NextResponse.json(
        { error: 'blockedUserId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_user_id', blockedUserId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'User unblocked' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
