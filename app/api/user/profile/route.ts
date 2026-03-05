import { NextRequest, NextResponse } from 'next/server'
import { getSession, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await getServerSupabase()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: userData,
      profile: profile,
    })
  } catch (error) {
    console.error('[v0] Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, age, gender, lookingForGender, bio, avatar_url, city, latitude, longitude } = body

    const supabase = await getServerSupabase()

    // Update profile
    if (name || age || gender || lookingForGender || bio || avatar_url) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          age,
          gender,
          looking_for_gender: lookingForGender,
          bio,
          avatar_url,
        })
        .eq('user_id', user.id)

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 400 }
        )
      }
    }

    // Update user location
    if (city || latitude || longitude) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          city,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        })
        .eq('id', user.id)

      if (userError) {
        return NextResponse.json(
          { error: 'Failed to update user data' },
          { status: 400 }
        )
      }
    }

    // Fetch updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    })
  } catch (error) {
    console.error('[v0] Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
