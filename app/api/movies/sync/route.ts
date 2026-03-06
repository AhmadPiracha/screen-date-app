import { getSupabaseServiceClient } from '@/lib/supabase'
import { getNowPlayingMovies, getPopularMovies, transformTMDBMovie, getMovieGenreIds } from '@/lib/tmdb'
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

    // Sync movie genres
    let genresMapped = 0
    if (data && data.length > 0) {
      // Create a map of tmdb_id to our db id
      const tmdbToDbId = new Map<number, string>()
      data.forEach(movie => {
        tmdbToDbId.set(movie.tmdb_id, movie.id)
      })

      // Build genre relationships
      const movieGenres: { movie_id: string; genre_id: number }[] = []
      uniqueMovies.forEach(tmdbMovie => {
        const dbId = tmdbToDbId.get(tmdbMovie.id)
        if (dbId) {
          const genreIds = getMovieGenreIds(tmdbMovie)
          genreIds.forEach(genreId => {
            movieGenres.push({ movie_id: dbId, genre_id: genreId })
          })
        }
      })

      genresMapped = movieGenres.length

      // Insert movie genres (ignore duplicates)
      if (movieGenres.length > 0) {
        // Delete existing genre mappings for these movies first
        const movieIds = [...new Set(movieGenres.map(mg => mg.movie_id))]
        await supabase
          .from('movie_genres')
          .delete()
          .in('movie_id', movieIds)

        // Insert new mappings
        const { error: genreError } = await supabase
          .from('movie_genres')
          .insert(movieGenres)
        
        if (genreError) {
          console.error('Genre sync error:', genreError)
        }
      }
    }

    return NextResponse.json({
      message: 'Movies synced successfully',
      synced: moviesToInsert.length,
      genresMapped,
      movies: data?.slice(0, 3),
    })
  } catch (error) {
    console.error('Movie sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync movies' },
      { status: 500 }
    )
  }
}
