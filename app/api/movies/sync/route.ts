import { getSupabaseServiceClient } from '@/lib/supabase'
import { getNowPlayingMovies, getPopularMovies, transformTMDBMovie } from '@/lib/tmdb'
import { NextRequest, NextResponse } from 'next/server'

// POST sync movies from TMDB to database
export async function POST(request: NextRequest) {
  try {
    // Check for API key or admin auth
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow without auth for dev, but require for production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const supabase = getSupabaseServiceClient()
    
    // Fetch now playing and popular movies
    const [nowPlaying, popular] = await Promise.all([
      getNowPlayingMovies(1),
      getPopularMovies(1),
    ])

    // Combine and deduplicate
    const allMovies = [...nowPlaying.results, ...popular.results]
    const uniqueMovies = Array.from(
      new Map(allMovies.map((m) => [m.id, m])).values()
    )

    // Transform to our format
    const moviesToInsert = uniqueMovies.map(transformTMDBMovie)

    // Upsert movies (update if exists, insert if not)
    const { data, error } = await supabase
      .from('movies')
      .upsert(moviesToInsert, {
        onConflict: 'tmdb_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Sync error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Movies synced successfully',
      synced: moviesToInsert.length,
      movies: data,
    })
  } catch (error) {
    console.error('Movie sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync movies' },
      { status: 500 }
    )
  }
}
