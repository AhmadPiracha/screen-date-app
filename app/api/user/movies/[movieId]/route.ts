import { NextRequest, NextResponse } from 'next/server'
import { getSession, getServerSupabase } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await getServerSupabase()
    const movieId = params.movieId

    const { error } = await supabase
      .from('user_movies')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove movie' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Movie removed successfully',
    })
  } catch (error) {
    console.error('[v0] Delete movie error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
