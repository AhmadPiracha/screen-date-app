import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await getServerSupabase()
    const userId = params.userId

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, city, created_at')
      .eq('id', userId)
      .single()

    // Get user's favorite movies
    const { data: movies } = await supabase
      .from('user_movies')
      .select('movies(id, title, tmdb_id, poster_url, overview)')
      .eq('user_id', userId)

    return NextResponse.json({
      user: userData,
      profile: profile,
      movies: movies?.map((m: any) => m.movies) || [],
    })
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
