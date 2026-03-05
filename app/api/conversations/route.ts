import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET user's conversations (matched connections)
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

    // Get all matches where user is involved
    const { data: matches1 } = await supabase
      .from('matches')
      .select('id, user2_id, created_at')
      .eq('user1_id', user.id)

    const { data: matches2 } = await supabase
      .from('matches')
      .select('id, user1_id, created_at')
      .eq('user2_id', user.id)

    // Combine and map to conversation format
    const conversations = [
      ...(matches1 || []).map((m) => ({
        matchId: m.id,
        otherUserId: m.user2_id,
        connectedAt: m.created_at,
      })),
      ...(matches2 || []).map((m) => ({
        matchId: m.id,
        otherUserId: m.user1_id,
        connectedAt: m.created_at,
      })),
    ]

    if (conversations.length === 0) {
      return NextResponse.json(
        { conversations: [] },
        { status: 200 }
      )
    }

    // Get profile info for each matched user
    const otherUserIds = conversations.map((c) => c.otherUserId)
    const { data: otherProfiles } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', otherUserIds)

    // Get city info from users table
    const { data: otherUsers } = await supabase
      .from('users')
      .select('id, city')
      .in('id', otherUserIds)

    // Get latest message for each conversation
    const matchIds = conversations.map((c) => c.matchId)
    const { data: latestMessages } = await supabase
      .from('messages')
      .select('match_id, content, created_at')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false })

    // Combine all data
    const enrichedConversations = conversations.map((conv) => {
      const profile = (otherProfiles || []).find(
        (p) => p.user_id === conv.otherUserId
      )
      const userInfo = (otherUsers || []).find(
        (u) => u.id === conv.otherUserId
      )
      const latestMessage = (latestMessages || []).find(
        (m) => m.match_id === conv.matchId
      )

      return {
        ...conv,
        otherUserProfile: profile ? { ...profile, city: userInfo?.city } : null,
        lastMessage: latestMessage?.content,
        lastMessageTime: latestMessage?.created_at,
      }
    })

    return NextResponse.json(
      { conversations: enrichedConversations },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
