import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET user's matches
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

    // Get all matches where user is either user1_id or user2_id
    const { data: matches1 } = await supabase
      .from('matches')
      .select('*, profiles!matches_user2_id_fkey(*)')
      .eq('user1_id', user.id)

    const { data: matches2 } = await supabase
      .from('matches')
      .select('*, profiles!matches_user1_id_fkey(*)')
      .eq('user2_id', user.id)

    // Format matches with the other user's profile
    const allMatches = [
      ...(matches1 || []).map((m) => ({
        id: m.id,
        created_at: m.created_at,
        movie_id: m.movie_id,
        matchedUser: m.profiles,
        matchedUserId: m.user2_id,
      })),
      ...(matches2 || []).map((m) => ({
        id: m.id,
        created_at: m.created_at,
        movie_id: m.movie_id,
        matchedUser: m.profiles,
        matchedUserId: m.user1_id,
      })),
    ]

    return NextResponse.json(
      { matches: allMatches },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a like (which may result in a match)
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

    const body = await request.json()
    const targetUserId = body.targetUserId || body.target_user_id

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      )
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot like yourself' },
        { status: 400 }
      )
    }

    // Check if blocked
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_user_id', targetUserId)
      .single()

    if (blocked) {
      return NextResponse.json(
        { error: 'User is blocked' },
        { status: 403 }
      )
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('to_user_id', targetUserId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this user' },
        { status: 409 }
      )
    }

    // Create the like
    const { error: likeError } = await supabase
      .from('likes')
      .insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        liked: true,
      })

    if (likeError) {
      return NextResponse.json(
        { error: likeError.message },
        { status: 400 }
      )
    }

    // Check if target user already liked us (mutual like = match!)
    const { data: mutualLike } = await supabase
      .from('likes')
      .select('id')
      .eq('from_user_id', targetUserId)
      .eq('to_user_id', user.id)
      .eq('liked', true)
      .single()

    if (mutualLike) {
      // Create a match!
      // Get a common movie between the two users
      const { data: commonMovies } = await supabase
        .from('user_movies')
        .select('movie_id')
        .eq('user_id', user.id)

      const userMovieIds = (commonMovies || []).map(m => m.movie_id)

      let commonMovieId = null
      if (userMovieIds.length > 0) {
        const { data: targetCommon } = await supabase
          .from('user_movies')
          .select('movie_id')
          .eq('user_id', targetUserId)
          .in('movie_id', userMovieIds)
          .limit(1)
          .single()
        
        commonMovieId = targetCommon?.movie_id || null
      }

      // Create match (ensure user1_id < user2_id to avoid duplicates)
      const [u1, u2] = user.id < targetUserId 
        ? [user.id, targetUserId] 
        : [targetUserId, user.id]

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          user1_id: u1,
          user2_id: u2,
          movie_id: commonMovieId,
        })
        .select()
        .single()

      if (matchError) {
        // Match might already exist
        console.error('Match creation error:', matchError)
      }

      return NextResponse.json({
        message: "It's a match!",
        match: match,
        isMatch: true,
      }, { status: 201 })
    }

    return NextResponse.json({
      message: 'Like recorded',
      isMatch: false,
    }, { status: 201 })
  } catch (error) {
    console.error('Create like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
