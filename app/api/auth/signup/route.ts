import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, age, gender, city, latitude, longitude, lookingForGender, bio } = body

    // Validate required fields
    if (!email || !password || !name || !age || !gender || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServiceClient()

    // Sign up the user
    const { data, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
    })

    if (signupError) {
      console.error('[Signup] Auth error:', signupError)
      return NextResponse.json(
        { error: signupError.message },
        { status: 400 }
      )
    }

    const userId = data.user.id

    // The auth trigger auto-creates a users row, so we UPSERT to add city/location
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        city,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (userError) {
      console.error('[Signup] User table error:', userError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + userError.message },
        { status: 400 }
      )
    }

    // Create user profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name,
        age: parseInt(age),
        gender,
        looking_for_gender: lookingForGender,
        bio: bio || null,
      })

    if (profileError) {
      console.error('[Signup] Profile table error:', profileError)
      // Clean up if profile creation fails
      await supabase.from('users').delete().eq('id', userId)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create profile: ' + profileError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: data.user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Signup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
