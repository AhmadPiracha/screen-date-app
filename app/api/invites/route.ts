import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// GET user's invites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invites created by user
    const { data: invites, error } = await supabase
      .from('invites')
      .select(`
        *,
        invitee:users!invites_invitee_id_fkey(
          profiles(name, avatar_url)
        )
      `)
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Get stats
    const total = invites?.length || 0
    const accepted = invites?.filter((i: any) => i.status === 'accepted').length || 0

    return NextResponse.json({
      invites: invites || [],
      stats: {
        total,
        accepted,
        pending: total - accepted,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Get invites error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new invite code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a unique invite code
    const inviteCode = nanoid(8).toUpperCase()

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        inviter_id: user.id,
        invite_code: inviteCode,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Generate the full invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://screendate.vercel.app'
    const inviteUrl = `${baseUrl}/invite/${inviteCode}`

    return NextResponse.json({
      invite,
      inviteUrl,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
