import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

// POST create shareable match link
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform } = body

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        movie:movies(title, poster_url),
        user1:users!matches_user1_id_fkey(profiles(name)),
        user2:users!matches_user2_id_fkey(profiles(name))
      `)
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Generate share code
    const shareCode = nanoid(10)

    const { data: share, error: shareError } = await supabase
      .from('match_shares')
      .insert({
        match_id: matchId,
        shared_by: user.id,
        share_code: shareCode,
        platform: platform || null,
      })
      .select()
      .single()

    if (shareError) {
      console.error('Error creating share:', shareError)
      return NextResponse.json({ error: shareError.message }, { status: 400 })
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://screendate.vercel.app'
    const shareUrl = `${baseUrl}/shared/${shareCode}`

    // Determine other user's name
    const otherUserName = match.user1_id === user.id 
      ? match.user2?.profiles?.name 
      : match.user1?.profiles?.name

    return NextResponse.json({
      share,
      shareUrl,
      shareData: {
        movieTitle: match.movie?.title,
        moviePoster: match.movie?.poster_url,
        matchedWith: otherUserName,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create share error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
