import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/ratelimit'

// GET messages (for a specific conversation)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      )
    }

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

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, content, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Get sender profile info separately
    const senderIds = [...new Set((messages || []).map(m => m.sender_id))]
    let profiles: Record<string, { name: string; avatar_url: string | null }> = {}
    
    if (senderIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', senderIds)
      
      for (const p of profileData || []) {
        profiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url }
      }
    }

    // Attach profile info to messages
    const messagesWithProfiles = (messages || []).map(m => ({
      ...m,
      senderProfile: profiles[m.sender_id] || null
    }))

    return NextResponse.json(
      {
        messages: messagesWithProfiles,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST send a message
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

    // Rate limiting: max 100 messages per hour
    const rateLimit = checkRateLimit(user.id, 'messages', RATE_LIMITS.messages)
    if (!rateLimit.success) {
      return NextResponse.json(rateLimitResponse(rateLimit), { status: 429 })
    }

    const { matchId, content } = await request.json()

    if (!matchId || !content) {
      return NextResponse.json(
        { error: 'matchId and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          match_id: matchId,
          sender_id: user.id,
          content: content.trim(),
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

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
