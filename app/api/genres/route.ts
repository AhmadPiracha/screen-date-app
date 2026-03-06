import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all genres
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: genres, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      // If genres table doesn't exist yet, return default genres
      return NextResponse.json({
        genres: [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
          { id: 16, name: 'Animation' },
          { id: 35, name: 'Comedy' },
          { id: 80, name: 'Crime' },
          { id: 99, name: 'Documentary' },
          { id: 18, name: 'Drama' },
          { id: 10751, name: 'Family' },
          { id: 14, name: 'Fantasy' },
          { id: 36, name: 'History' },
          { id: 27, name: 'Horror' },
          { id: 10402, name: 'Music' },
          { id: 9648, name: 'Mystery' },
          { id: 10749, name: 'Romance' },
          { id: 878, name: 'Sci-Fi' },
          { id: 53, name: 'Thriller' },
          { id: 10752, name: 'War' },
          { id: 37, name: 'Western' },
        ]
      })
    }

    return NextResponse.json({ genres: genres || [] })
  } catch (error) {
    console.error('Get genres error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
