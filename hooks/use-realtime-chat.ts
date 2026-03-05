'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

interface UseRealtimeChatOptions {
  matchId: string
  onNewMessage: (message: RealtimeMessage) => void
  enabled?: boolean
}

export function useRealtimeChat({ matchId, onNewMessage, enabled = true }: UseRealtimeChatOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const subscribe = useCallback(() => {
    if (!enabled || !matchId) return

    const supabase = supabaseRef.current

    // Unsubscribe from previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to new messages in this match
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as RealtimeMessage
          onNewMessage(newMessage)
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for match ${matchId}:`, status)
      })

    channelRef.current = channel
  }, [matchId, onNewMessage, enabled])

  useEffect(() => {
    subscribe()

    return () => {
      // Cleanup subscription on unmount
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [subscribe])

  // Return a method to manually resubscribe if needed
  return { resubscribe: subscribe }
}
