'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { SwipeCard, ActionButtons } from '@/components/feed/SwipeCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Film, Heart, RefreshCw, Settings } from 'lucide-react'
import Link from 'next/link'
import type { DiscoverProfile } from '@/types'

export default function DiscoverPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchPopup, setMatchPopup] = useState<DiscoverProfile | null>(null)
  const [error, setError] = useState('')

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/matches/discover?limit=20')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(data.error || 'Failed to fetch profiles')
      }
      
      setProfiles(data.matches || [])
      setCurrentIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const handleSwipe = async (direction: 'left' | 'right') => {
    const profile = profiles[currentIndex]
    if (!profile) return

    // Move to next card immediately for UX
    setCurrentIndex((prev) => prev + 1)

    if (direction === 'right') {
      // Like the user
      try {
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: profile.user_id }),
        })
        
        const data = await response.json()
        
        // Check if it's a match!
        if (data.match && data.match.status === 'connected') {
          setMatchPopup(profile)
        }
      } catch (err) {
        console.error('Error liking profile:', err)
      }
    }
    // For left swipe (dislike), we just skip - no API call needed
  }

  const handleLike = () => handleSwipe('right')
  const handleDislike = () => handleSwipe('left')

  const closeMatchPopup = () => {
    setMatchPopup(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const hasMoreProfiles = currentIndex < profiles.length

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
        
        <h1 className="text-xl font-bold text-purple-600 flex items-center gap-2">
          <Film className="w-5 h-5" />
          Discover
        </h1>
        
        <Link href="/matches">
          <Button variant="ghost" size="icon" className="relative">
            <Heart className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center px-4 pt-8">
        {error && (
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchProfiles}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && hasMoreProfiles && (
          <>
            {/* Card stack */}
            <div className="relative w-full max-w-sm h-[520px] flex items-center justify-center">
              <AnimatePresence>
                {profiles.slice(currentIndex, currentIndex + 2).map((profile, idx) => (
                  <SwipeCard
                    key={profile.user_id}
                    profile={profile}
                    onSwipe={handleSwipe}
                    isTop={idx === 0}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <ActionButtons
              onLike={handleLike}
              onDislike={handleDislike}
            />
          </>
        )}

        {!error && !hasMoreProfiles && (
          <Card className="w-full max-w-sm mt-8">
            <CardContent className="pt-6 text-center">
              <Film className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No more profiles</h3>
              <p className="text-muted-foreground mb-4">
                Check back later for new movie partners in your city
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={fetchProfiles}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/movies">
                  <Button>
                    <Film className="w-4 h-4 mr-2" />
                    Add Movies
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Popup */}
      {matchPopup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              It&apos;s a Match!
            </h2>
            <p className="text-muted-foreground mb-6">
              You and {matchPopup.name} both want to watch movies together!
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={closeMatchPopup} className="flex-1">
                Keep Swiping
              </Button>
              <Link href="/matches" className="flex-1">
                <Button className="w-full">
                  Send Message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
