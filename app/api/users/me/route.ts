import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET current user info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user record from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          ...userData,
        },
        profile: profileData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update current user info
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { city, latitude, longitude, name, age, gender, lookingForGender, bio, avatar_url } = body

    // Update users table (city, location)
    if (city !== undefined || latitude !== undefined || longitude !== undefined) {
      const userUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      if (city !== undefined) userUpdate.city = city
      if (latitude !== undefined) userUpdate.latitude = latitude
      if (longitude !== undefined) userUpdate.longitude = longitude

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)

      if (userError) {
        return NextResponse.json(
          { error: userError.message },
          { status: 400 }
        )
      }
    }

    // Update profiles table
    if (name !== undefined || age !== undefined || gender !== undefined || 
        lookingForGender !== undefined || bio !== undefined || avatar_url !== undefined) {
      const profileUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
      if (name !== undefined) profileUpdate.name = name
      if (age !== undefined) profileUpdate.age = parseInt(age)
      if (gender !== undefined) profileUpdate.gender = gender
      if (lookingForGender !== undefined) profileUpdate.looking_for_gender = lookingForGender
      if (bio !== undefined) profileUpdate.bio = bio
      if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', user.id)

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
