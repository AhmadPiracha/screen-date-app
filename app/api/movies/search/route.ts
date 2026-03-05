import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase, getSession } from '@/lib/auth'

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

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const page = searchParams.get('page') || '1'

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB API key not configured' },
        { status: 500 }
      )
    }

    // Search TMDB for movies
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&sort_by=popularity.desc`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!response.ok) {
      throw new Error('TMDB API error')
    }

    const data = await response.json()

    const supabase = await getServerSupabase()

    // Check which movies are already in our database
    const tmdbIds = data.results.map((movie: any) => movie.id)
    const { data: existingMovies } = await supabase
      .from('movies')
      .select('tmdb_id')
      .in('tmdb_id', tmdbIds)

    const existingTmdbIds = new Set(existingMovies?.map((m: any) => m.tmdb_id) || [])

    // Format results
    const results = data.results.map((movie: any) => ({
      tmdb_id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null,
      release_date: movie.release_date,
      popularity: movie.popularity,
      exists_in_db: existingTmdbIds.has(movie.id),
    }))

    return NextResponse.json({
      results,
      total_pages: data.total_pages,
      page: parseInt(page),
    })
  } catch (error) {
    console.error('[v0] Movie search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
