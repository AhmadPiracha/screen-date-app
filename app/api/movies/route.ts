import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET movies (with optional search/filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const genre = searchParams.get('genre')
    const year = searchParams.get('year')
    const category = searchParams.get('category') || 'popular'
    const minRating = searchParams.get('minRating')

    const supabase = await createClient()

    // Build the query with movie_genres join if filtering by genre
    let query = supabase.from('movies').select('*')

    // Apply category-based ordering and filtering
    const currentDate = new Date().toISOString().split('T')[0]
    
    switch (category) {
      case 'now_playing':
        // Movies released in the last 60 days
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        query = query.gte('release_date', sixtyDaysAgo).lte('release_date', currentDate)
        query = query.order('release_date', { ascending: false })
        break
      case 'upcoming':
        // Movies releasing in the future
        query = query.gt('release_date', currentDate)
        query = query.order('release_date', { ascending: true })
        break
      case 'top_rated':
        // Order by vote average (rating)
        query = query.order('vote_average', { ascending: false })
        break
      case 'popular':
      default:
        query = query.order('popularity', { ascending: false })
        break
    }

    // Apply year filter
    if (year) {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query.gte('release_date', startDate).lte('release_date', endDate)
    }

    // Apply minimum rating filter
    if (minRating) {
      query = query.gte('vote_average', parseFloat(minRating))
    }

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: movies, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // If filtering by genre, we need to filter in memory since Supabase
    // doesn't support easy many-to-many filtering
    let filteredMovies = movies || []
    
    if (genre) {
      const genreId = parseInt(genre)
      // Fetch movie IDs for this genre
      const { data: movieGenres } = await supabase
        .from('movie_genres')
        .select('movie_id')
        .eq('genre_id', genreId)
      
      if (movieGenres) {
        const movieIdsInGenre = new Set(movieGenres.map(mg => mg.movie_id))
        filteredMovies = filteredMovies.filter(m => movieIdsInGenre.has(m.id))
      }
    }

    return NextResponse.json(
      {
        movies: filteredMovies,
        limit,
        offset,
        total: filteredMovies.length,
        category,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get movies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST new movie (for adding to database)
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

    const movieData = await request.json()

    // Check if movie already exists (by TMDB ID)
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', movieData.tmdb_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { movie: existing, message: 'Movie already exists' },
        { status: 200 }
      )
    }

    // Add new movie
    const { data: movie, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(movie, { status: 201 })
  } catch (error) {
    console.error('Create movie error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
