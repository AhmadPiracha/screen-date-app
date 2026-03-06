'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageCircle, Heart, Film, ArrowLeft, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function MatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sharing, setSharing] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleShare = async (matchId: string, userName: string) => {
    setSharing(matchId)
    try {
      const response = await fetch(`/api/matches/${matchId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'general' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (navigator.share) {
          await navigator.share({
            title: 'I found a movie match!',
            text: `I matched with ${userName} on ScreenDate! 🎬`,
            url: data.shareUrl,
          })
        } else {
          navigator.clipboard.writeText(data.shareUrl)
          alert('Share link copied!')
        }
      }
    } catch (err) {
      console.error('Error sharing match:', err)
    } finally {
      setSharing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/discover">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Matches
        </h1>
      </div>

      <div className="p-4">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-4">
              Keep swiping to find your movie partner!
            </p>
            <Link href="/discover">
              <Button>
                <Film className="w-4 h-4 mr-2" />
                Discover
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* New Matches Section */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                New Matches
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {conversations
                  .filter((c) => !c.lastMessage)
                  .map((conversation) => (
                    <Link
                      key={conversation.matchId}
                      href={`/chat/${conversation.matchId}`}
                      className="flex flex-col items-center gap-1 min-w-[72px]"
                    >
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-purple-500">
                          <AvatarImage src={conversation.otherUserProfile?.avatar_url || ''} />
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                            {conversation.otherUserProfile?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleShare(conversation.matchId, conversation.otherUserProfile?.name || 'someone')
                          }}
                          className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                          {sharing === conversation.matchId ? (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                          ) : (
                            <Share2 className="w-3 h-3 text-purple-500" />
                          )}
                        </button>
                        <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-center truncate w-full">
                        {conversation.otherUserProfile?.name?.split(' ')[0] || 'User'}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Messages Section */}
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Messages
            </h2>
            {conversations
              .filter((c) => c.lastMessage)
              .map((conversation) => (
                <Link key={conversation.matchId} href={`/chat/${conversation.matchId}`}>
                  <Card className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={conversation.otherUserProfile?.avatar_url || ''} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {conversation.otherUserProfile?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">
                            {conversation.otherUserProfile?.name || 'User'}
                          </h3>
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                                addSuffix: false,
                              })}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage || 'Start the conversation!'}
                        </p>
                      </div>
                      
                      <MessageCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}

            {/* Show all matches without messages at the end */}
            {conversations.filter((c) => !c.lastMessage).length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground mt-6 mb-3">
                  Start a Conversation
                </h2>
                {conversations
                  .filter((c) => !c.lastMessage)
                  .map((conversation) => (
                    <Link key={conversation.matchId} href={`/chat/${conversation.matchId}`}>
                      <Card className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={conversation.otherUserProfile?.avatar_url || ''} />
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {conversation.otherUserProfile?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {conversation.otherUserProfile?.name || 'User'}
                            </h3>
                            <p className="text-sm text-purple-500">
                              Say hello!
                            </p>
                          </div>
                          
                          <Badge variant="secondary">New</Badge>
                        </div>
                      </Card>
                    </Link>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
