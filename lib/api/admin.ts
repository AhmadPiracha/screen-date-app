import { createClient } from '@/lib/supabase/server'

export async function checkAdminAccess() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin in auth metadata
    const isAdmin = user.user_metadata?.is_admin === true

    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required')
    }

    return user
  } catch (error) {
    throw error
  }
}
