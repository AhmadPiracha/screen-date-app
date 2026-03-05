import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Signed out successfully',
    })
  } catch (error) {
    console.error('[v0] Sign out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
