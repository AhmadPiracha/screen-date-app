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

    let query = supabase
      .from('profiles')
      .select('*, users!inner(email, created_at)')
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,users.email.ilike.%${search}%`
      )
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

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
