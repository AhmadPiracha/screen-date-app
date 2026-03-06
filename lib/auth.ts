// Re-exports for backward compatibility — prefer importing from '@/lib/supabase/server' directly
import { createClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function getServerSupabase() {
  return createClient()
}

