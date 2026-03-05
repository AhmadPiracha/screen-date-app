import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
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

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get user data (for city)
    const { data: userData } = await supabase
      .from('users')
      .select('city, latitude, longitude')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Combine profile with city from users table
    return NextResponse.json({
      ...profile,
      city: userData?.city,
      latitude: userData?.latitude,
      longitude: userData?.longitude,
    }, { status: 200 })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
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

    const body = await request.json()
    const { city, latitude, longitude, ...profileUpdates } = body

    // Update profiles table (name, age, gender, etc.)
    if (Object.keys(profileUpdates).length > 0) {
      // Map camelCase to snake_case
      const mappedUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (profileUpdates.name !== undefined) mappedUpdates.name = profileUpdates.name
      if (profileUpdates.age !== undefined) mappedUpdates.age = parseInt(profileUpdates.age)
      if (profileUpdates.gender !== undefined) mappedUpdates.gender = profileUpdates.gender
      if (profileUpdates.lookingForGender !== undefined) mappedUpdates.looking_for_gender = profileUpdates.lookingForGender
      if (profileUpdates.looking_for_gender !== undefined) mappedUpdates.looking_for_gender = profileUpdates.looking_for_gender
      if (profileUpdates.bio !== undefined) mappedUpdates.bio = profileUpdates.bio
      if (profileUpdates.avatar_url !== undefined) mappedUpdates.avatar_url = profileUpdates.avatar_url

      const { error: profileError } = await supabase
        .from('profiles')
        .update(mappedUpdates)
        .eq('user_id', user.id)

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        )
      }
    }

    // Update users table (city, location)
    if (city !== undefined || latitude !== undefined || longitude !== undefined) {
      const userUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (city !== undefined) userUpdates.city = city
      if (latitude !== undefined) userUpdates.latitude = latitude
      if (longitude !== undefined) userUpdates.longitude = longitude

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)

      if (userError) {
        return NextResponse.json(
          { error: userError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
