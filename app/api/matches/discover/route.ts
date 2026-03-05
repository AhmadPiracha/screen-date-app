import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET potential matches (discover page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Parallelize initial data fetching
    const [userDataRes, userProfileRes, userMoviesRes] = await Promise.all([
      supabase.from('users').select('city, latitude, longitude').eq('id', user.id).single(),
      supabase.from('profiles').select('gender, looking_for_gender').eq('user_id', user.id).single(),
      supabase.from('user_movies').select('movie_id').eq('user_id', user.id)
    ])

    const userData = userDataRes.data
    const userProfile = userProfileRes.data
    const userMovies = userMoviesRes.data

    if (userDataRes.error || !userData) {
      return NextResponse.json(
        { error: 'Could not fetch user data' },
        { status: 400 }
      )
    }

    if (!userData.city) {
      return NextResponse.json(
        { error: 'Please set your city in your profile' },
        { status: 400 }
      )
    }

    if (userMoviesRes.error) {
      return NextResponse.json(
        { error: userMoviesRes.error.message },
        { status: 400 }
      )
    }

    const userMovieIds = userMovies?.map((um) => um.movie_id) || []

    if (userMovieIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Please add some movies to your profile first',
          matches: []
        },
        { status: 200 }
      )
    }

    // Find users in same city
    const { data: cityUsers, error: cityError } = await supabase
      .from('users')
      .select('id')
      .eq('city', userData.city)
      .neq('id', user.id)

    if (cityError) {
      return NextResponse.json(
        { error: cityError.message },
        { status: 400 }
      )
    }

    const cityUserIds = cityUsers?.map((u) => u.id) || []

    if (cityUserIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'No other users in your city yet',
          matches: []
        },
        { status: 200 }
      )
    }

    // Parallelize: Get matched users, blocked users, and existing likes
    const [matchedUsersRes, blockedUsersRes, existingLikesRes] = await Promise.all([
      supabase.from('user_movies').select('user_id').in('user_id', cityUserIds).in('movie_id', userMovieIds),
      supabase.from('blocked_users').select('blocked_user_id').eq('blocker_id', user.id),
      supabase.from('likes').select('to_user_id').eq('from_user_id', user.id)
    ])

    if (matchedUsersRes.error) {
      return NextResponse.json(
        { error: matchedUsersRes.error.message },
        { status: 400 }
      )
    }

    // Get unique user IDs with common movies
    const uniqueUserIds = Array.from(
      new Set((matchedUsersRes.data || []).map((m) => m.user_id))
    )

    if (uniqueUserIds.length === 0) {
      return NextResponse.json(
        {
          error: 'No matches found with common movies',
          matches: [],
        },
        { status: 200 }
      )
    }

    const blockedIds = (blockedUsersRes.data || []).map((b) => b.blocked_user_id)
    const likedIds = (existingLikesRes.data || []).map((l) => l.to_user_id)
    const excludeIds = new Set([...blockedIds, ...likedIds, user.id])

    // Filter out blocked and already interacted users
    const candidateIds = uniqueUserIds.filter(
      (id) => !excludeIds.has(id)
    )

    if (candidateIds.length === 0) {
      return NextResponse.json(
        {
          error: 'No new matches available',
          matches: [],
        },
        { status: 200 }
      )
    }

    // Build query for profiles - only select needed columns
    let profileQuery = supabase
      .from('profiles')
      .select('user_id, name, age, gender, bio, avatar_url')
      .in('user_id', candidateIds)

    // Apply gender filter if user has a preference
    if (userProfile?.looking_for_gender && userProfile.looking_for_gender !== 'everyone' && userProfile.looking_for_gender !== 'any') {
      profileQuery = profileQuery.eq('gender', userProfile.looking_for_gender)
    }

    const { data: matches, error: finalError } = await profileQuery
      .range(offset, offset + limit - 1)

    if (finalError) {
      return NextResponse.json(
        { error: finalError.message },
        { status: 400 }
      )
    }

    // Get all user cities in one query (fix N+1)
    const profileUserIds = (matches || []).map(m => m.user_id)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, city')
      .in('id', profileUserIds)

    const cityMap = new Map((usersData || []).map(u => [u.id, u.city]))
    const matchesWithCity = (matches || []).map(profile => ({
      ...profile,
      city: cityMap.get(profile.user_id)
    }))

    return NextResponse.json(
      {
        matches: matchesWithCity,
        total: candidateIds.length,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Discover matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
