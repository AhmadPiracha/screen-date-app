import { NextRequest, NextResponse } from 'next/server'
import { getSession, getServerSupabase } from '@/lib/auth'
import { getSupabaseServiceClient } from '@/lib/supabase'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await getServerSupabase()

    const { data: userMovies, error } = await supabase
      .from('user_movies')
      .select('movies(*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch user movies' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      movies: userMovies?.map((um: any) => um.movies) || [],
    })
  } catch (error) {
    console.error('[v0] Get user movies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tmdb_id, title, overview, poster_url, release_date } = body

    if (!tmdb_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await getServerSupabase()

    // Check if movie exists in database
    let { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', tmdb_id)
      .single()

    // If movie doesn't exist, create it (using service role to bypass RLS)
    if (!movie) {
      const serviceSupabase = getSupabaseServiceClient()
      const { data: newMovie, error: createError } = await serviceSupabase
        .from('movies')
        .insert({
          tmdb_id,
          title,
          overview,
          poster_url,
          release_date,
          popularity: 0,
        })
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create movie' },
          { status: 400 }
        )
      }

      movie = newMovie
    }

    // Add movie to user's selection
    const { data: userMovie, error: addError } = await supabase
      .from('user_movies')
      .insert({
        user_id: user.id,
        movie_id: movie.id,
      })
      .select('movies(*)')
      .single()

    if (addError) {
      // Check if movie is already added
      if (addError.code === '23505') {
        return NextResponse.json(
          { error: 'Movie already added to your selection' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to add movie' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Movie added successfully',
        movie: userMovie?.movies,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Add movie error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
