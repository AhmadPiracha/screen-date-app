import { createClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/lib/api/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Query profiles with related user data
    let query = supabase
      .from('profiles')
      .select('*, users!inner(id, city, created_at)')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Format response
    const users = (profiles || []).map((profile: any) => ({
      id: profile.user_id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      city: profile.users?.city || profile.city,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      created_at: profile.users?.created_at || profile.created_at,
    }))

    return NextResponse.json(
      {
        users,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get users error:', error)
    const statusCode =
      error.message === 'Forbidden: Admin access required' ? 403 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}
