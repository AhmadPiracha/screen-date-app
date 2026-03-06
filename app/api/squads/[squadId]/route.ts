import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ squadId: string }>
}

// GET squad details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { squadId } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: squad, error } = await supabase
      .from('movie_squads')
      .select(`
        *,
        movie:movies(*),
        creator:users!movie_squads_creator_id_fkey(
          id,
          profiles(name, avatar_url, age, gender)
        ),
        members:squad_members(
          user:users(
            id,
            city,
            profiles(name, avatar_url, age, gender)
          ),
          role,
          joined_at
        )
      `)
      .eq('id', squadId)
      .single()

    if (error) {
      console.error('Error fetching squad:', error)
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    const formattedSquad = {
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
        age: m.user?.profiles?.age,
        gender: m.user?.profiles?.gender,
        city: m.user?.city,
        role: m.role,
        joinedAt: m.joined_at,
      })),
      isMember: (squad.members || []).some((m: any) => m.user?.id === user.id),
      isCreator: squad.creator_id === user.id,
    }

    return NextResponse.json({ squad: formattedSquad }, { status: 200 })
  } catch (error: any) {
    console.error('Get squad error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST join squad
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { squadId } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check squad exists and is open
    const { data: squad, error: squadError } = await supabase
      .from('movie_squads')
      .select('*, members:squad_members(count)')
      .eq('id', squadId)
      .single()

    if (squadError || !squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    if (squad.status !== 'open') {
      return NextResponse.json({ error: 'Squad is not open for joining' }, { status: 400 })
    }

    // Get current member count
    const { count: memberCount } = await supabase
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('squad_id', squadId)

    if ((memberCount || 0) >= squad.max_members) {
      return NextResponse.json({ error: 'Squad is full' }, { status: 400 })
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    // Join squad
    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squadId,
        user_id: user.id,
        role: 'member',
      })

    if (joinError) {
      console.error('Error joining squad:', joinError)
      return NextResponse.json({ error: joinError.message }, { status: 400 })
    }

    // Check if squad is now full
    const newMemberCount = (memberCount || 0) + 1
    if (newMemberCount >= squad.max_members) {
      await supabase
        .from('movie_squads')
        .update({ status: 'full' })
        .eq('id', squadId)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Join squad error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE leave squad
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { squadId } = await params
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the creator
    const { data: squad } = await supabase
      .from('movie_squads')
      .select('creator_id')
      .eq('id', squadId)
      .single()

    if (squad?.creator_id === user.id) {
      // Creator is leaving - cancel the squad
      await supabase
        .from('movie_squads')
        .update({ status: 'cancelled' })
        .eq('id', squadId)
    }

    // Remove from squad
    const { error } = await supabase
      .from('squad_members')
      .delete()
      .eq('squad_id', squadId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error leaving squad:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update squad status if it was full
    const { data: squadData } = await supabase
      .from('movie_squads')
      .select('status')
      .eq('id', squadId)
      .single()

    if (squadData?.status === 'full') {
      await supabase
        .from('movie_squads')
        .update({ status: 'open' })
        .eq('id', squadId)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Leave squad error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
