'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Film, Heart, Sparkles } from 'lucide-react'

export default function SharedMatchPage() {
  const params = useParams()
  const code = params.code as string
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Just show the promo - no API needed for the landing page
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-sm w-full overflow-hidden shadow-xl">
        {/* Celebration Header */}
        <div className="bg-purple-600 p-8 text-center text-white">
          <div className="flex justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8" />
            <Heart className="w-8 h-8 fill-white" />
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">It's a Match!</h1>
          <p className="text-purple-200">
            Someone found their movie partner on ScreenDate
          </p>
        </div>
        
        <CardContent className="p-6 text-center">
          {/* App Promo */}
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-purple-600" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Join ScreenDate</h2>
          <p className="text-gray-500 mb-6">
            Find someone who loves the same movies as you do
          </p>

          <div className="space-y-3">
            <Link href="/signup">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                I already have an account
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-400">
              ScreenDate connects movie lovers based on their taste in films
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
