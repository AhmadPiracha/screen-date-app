import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET movie squads
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const date = searchParams.get('date')
    const city = searchParams.get('city')
    const movieId = searchParams.get('movieId')
    const mySquads = searchParams.get('my') === 'true'

    let query = supabase
      .from('movie_squads')
      .select(`
        *,
        movie:movies(*),
        creator:users!movie_squads_creator_id_fkey(
          id,
          profiles(name, avatar_url)
        ),
        members:squad_members(
          user:users(
            id,
            profiles(name, avatar_url)
          )
        )
      `)
      .order('planned_date', { ascending: true })
      .order('planned_time', { ascending: true })

    if (mySquads) {
      // Get squads user is part of
      query = query.or(`creator_id.eq.${user.id}`)
    } else {
      // Get public open squads
      query = query.eq('is_public', true).in('status', ['open', 'full'])
    }

    if (date) {
      query = query.eq('planned_date', date)
    }

    if (city) {
      query = query.eq('city', city)
    }

    if (movieId) {
      query = query.eq('movie_id', movieId)
    }

    const { data: squads, error } = await query

    if (error) {
      console.error('Error fetching squads:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format and add member count
    const formattedSquads = (squads || []).map((squad: any) => ({
      id: squad.id,
      name: squad.name,
      plannedDate: squad.planned_date,
      plannedTime: squad.planned_time,
      cinemaName: squad.cinema_name,
      city: squad.city,
      maxMembers: squad.max_members,
      currentMembers: (squad.members || []).length,
      description: squad.description,
      status: squad.status,
      isPublic: squad.is_public,
      movie: squad.movie,
      creator: {
        id: squad.creator?.id,
        name: squad.creator?.profiles?.name,
        avatarUrl: squad.creator?.profiles?.avatar_url,
      },
      members: (squad.members || []).map((m: any) => ({
        id: m.user?.id,
        name: m.user?.profiles?.name,
        avatarUrl: m.user?.profiles?.avatar_url,
      })),
      isMember: (squad.members || []).some((m: any) => m.user?.id === user.id),
      isCreator: squad.creator_id === user.id,
    }))

    return NextResponse.json({ squads: formattedSquads }, { status: 200 })
  } catch (error: any) {
    console.error('Get squads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a squad
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { movieId, name, plannedDate, plannedTime, cinemaName, city, maxMembers, description, isPublic } = body

    if (!movieId || !name || !plannedDate) {
      return NextResponse.json(
        { error: 'Movie, name, and planned date are required' },
        { status: 400 }
      )
    }

    // Get user's city if not provided
    let squadCity = city
    if (!squadCity) {
      const { data: userData } = await supabase
        .from('users')
        .select('city')
        .eq('id', user.id)
        .single()
      squadCity = userData?.city
    }

    // Create squad
    const { data: squad, error: squadError } = await supabase
      .from('movie_squads')
      .insert({
        creator_id: user.id,
        movie_id: movieId,
        name,
        planned_date: plannedDate,
        planned_time: plannedTime || null,
        cinema_name: cinemaName || null,
        city: squadCity,
        max_members: maxMembers || 5,
        description: description || null,
        is_public: isPublic !== false,
        status: 'open',
      })
      .select()
      .single()

    if (squadError) {
      console.error('Error creating squad:', squadError)
      return NextResponse.json({ error: squadError.message }, { status: 400 })
    }

    // Add creator as first member
    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'creator',
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
    }

    return NextResponse.json({ squad }, { status: 201 })
  } catch (error: any) {
    console.error('Create squad error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
