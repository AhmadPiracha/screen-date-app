import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET movies (with optional search/filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    let query = supabase
      .from('movies')
      .select('*')
      .order('popularity', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: movies, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        movies,
        limit,
        offset,
        total: movies?.length || 0,
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
