import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ code: string }>
}

// GET validate invite code
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const supabase = await createClient()

    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        inviter:users!invites_inviter_id_fkey(
          profiles(name, avatar_url)
        )
      `)
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      inviter: {
        name: invite.inviter?.profiles?.name,
        avatarUrl: invite.inviter?.profiles?.avatar_url,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Validate invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST accept invite (after signup)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the invite
    const { data: invite, error: findError } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single()

    if (findError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
    }

    // Can't accept your own invite
    if (invite.inviter_id === user.id) {
      return NextResponse.json({ error: 'Cannot accept your own invite' }, { status: 400 })
    }

    // Accept the invite
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        invitee_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Error accepting invite:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Accept invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
