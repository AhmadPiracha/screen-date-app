import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET common movies between two users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
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

    // Get current user's movie IDs
    const { data: currentUserMovies, error: error1 } = await supabase
      .from('user_movies')
      .select('movie_id')
      .eq('user_id', user.id)

    if (error1) {
      return NextResponse.json(
        { error: error1.message },
        { status: 400 }
      )
    }

    const currentUserMovieIds = (currentUserMovies || []).map(
      (um) => um.movie_id
    )

    // Get other user's movie IDs
    const { data: otherUserMovies, error: error2 } = await supabase
      .from('user_movies')
      .select('movie_id')
      .eq('user_id', userId)

    if (error2) {
      return NextResponse.json(
        { error: error2.message },
        { status: 400 }
      )
    }

    const otherUserMovieIds = (otherUserMovies || []).map(
      (um) => um.movie_id
    )

    // Find intersection
    const commonMovieIds = currentUserMovieIds.filter((id) =>
      otherUserMovieIds.includes(id)
    )

    if (commonMovieIds.length === 0) {
      return NextResponse.json(
        { movies: [], count: 0 },
        { status: 200 }
      )
    }

    // Get movie details
    const { data: movies, error: error3 } = await supabase
      .from('movies')
      .select('*')
      .in('id', commonMovieIds)

    if (error3) {
      return NextResponse.json(
        { error: error3.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        movies: movies || [],
        count: (movies || []).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get common movies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
