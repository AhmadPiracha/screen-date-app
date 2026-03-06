import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET movie plans (tonight or specific date)
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

    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const city = searchParams.get('city')
    const movieId = searchParams.get('movieId')

    let query = supabase
      .from('movie_plans')
      .select(`
        *,
        movie:movies(*),
        user:users!inner(
          id,
          city,
          profiles!inner(name, avatar_url, age, gender)
        )
      `)
      .eq('status', 'active')
      .eq('looking_for_company', true)
      .eq('planned_date', date)
      .neq('user_id', user.id)
      .order('planned_time', { ascending: true })

    if (city) {
      query = query.eq('city', city)
    }

    if (movieId) {
      query = query.eq('movie_id', movieId)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error('Error fetching movie plans:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format the response
    const formattedPlans = (plans || []).map((plan: any) => ({
      id: plan.id,
      plannedDate: plan.planned_date,
      plannedTime: plan.planned_time,
      cinemaName: plan.cinema_name,
      city: plan.city,
      maxCompanions: plan.max_companions,
      note: plan.note,
      movie: plan.movie,
      user: {
        id: plan.user.id,
        name: plan.user.profiles?.name,
        avatarUrl: plan.user.profiles?.avatar_url,
        age: plan.user.profiles?.age,
        gender: plan.user.profiles?.gender,
        city: plan.user.city,
      },
    }))

    return NextResponse.json({ plans: formattedPlans }, { status: 200 })
  } catch (error: any) {
    console.error('Get movie plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a movie plan
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
    const { movieId, plannedDate, plannedTime, cinemaName, city, maxCompanions, note } = body

    if (!movieId || !plannedDate) {
      return NextResponse.json(
        { error: 'Movie and planned date are required' },
        { status: 400 }
      )
    }

    // Get user's city if not provided
    let planCity = city
    if (!planCity) {
      const { data: userData } = await supabase
        .from('users')
        .select('city')
        .eq('id', user.id)
        .single()
      planCity = userData?.city
    }

    const { data: plan, error } = await supabase
      .from('movie_plans')
      .upsert({
        user_id: user.id,
        movie_id: movieId,
        planned_date: plannedDate,
        planned_time: plannedTime || null,
        cinema_name: cinemaName || null,
        city: planCity,
        max_companions: maxCompanions || 1,
        note: note || null,
        status: 'active',
        looking_for_company: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,movie_id,planned_date',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating movie plan:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error: any) {
    console.error('Create movie plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE cancel a movie plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('movie_plans')
      .update({ status: 'cancelled' })
      .eq('id', planId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error cancelling movie plan:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Cancel movie plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
