'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  ArrowLeft, 
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageCircle,
  Share2,
  LogOut,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'

interface SquadMember {
  id: string
  name: string
  avatarUrl: string | null
  age: number | null
  gender: string | null
  city: string | null
  role: string
  joinedAt: string
}

interface Squad {
  id: string
  name: string
  plannedDate: string
  plannedTime: string | null
  cinemaName: string | null
  city: string | null
  maxMembers: number
  currentMembers: number
  description: string | null
  status: string
  isPublic: boolean
  movie: {
    id: string
    title: string
    poster_url: string
    overview: string
  }
  creator: {
    id: string
    name: string
    avatarUrl: string | null
  }
  members: SquadMember[]
  isMember: boolean
  isCreator: boolean
}

export default function SquadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const squadId = params.squadId as string

  const [loading, setLoading] = useState(true)
  const [squad, setSquad] = useState<Squad | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchSquad()
  }, [squadId])

  const fetchSquad = async () => {
    try {
      const response = await fetch(`/api/squads/${squadId}`)
      if (response.ok) {
        const data = await response.json()
        setSquad(data.squad)
      } else {
        router.push('/tonight')
      }
    } catch (err) {
      console.error('Error fetching squad:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSquad()
      }
    } catch (err) {
      console.error('Error joining squad:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/tonight')
      }
    } catch (err) {
      console.error('Error leaving squad:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/squads/${squadId}`
    if (navigator.share) {
      navigator.share({
        title: squad?.name,
        text: `Join me to watch ${squad?.movie.title}!`,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!squad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Squad not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Movie Banner */}
      <div className="relative h-48">
        <img
          src={squad.movie.poster_url || '/placeholder-movie.png'}
          alt={squad.movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Back Button */}
        <Link href="/tonight" className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="bg-black/30 text-white hover:bg-black/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        {/* Share Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 bg-black/30 text-white hover:bg-black/50"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {/* Squad Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <Badge 
            className={squad.status === 'open' ? 'bg-green-500 mb-2' : 'bg-gray-500 mb-2'}
          >
            {squad.status === 'open' ? 'Open' : squad.status}
          </Badge>
          <h1 className="text-xl font-bold">{squad.name}</h1>
          <p className="text-sm text-white/80">{squad.movie.title}</p>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Date/Time/Location */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">
                  {format(new Date(squad.plannedDate), 'EEEE, MMMM d')}
                </p>
                {squad.plannedTime && (
                  <p className="text-sm text-gray-500">{squad.plannedTime.slice(0, 5)}</p>
                )}
              </div>
            </div>

            {squad.cinemaName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium">{squad.cinemaName}</p>
                  {squad.city && <p className="text-sm text-gray-500">{squad.city}</p>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{squad.currentMembers} / {squad.maxMembers} members</p>
                <p className="text-sm text-gray-500">
                  {squad.maxMembers - squad.currentMembers} spots left
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {squad.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-gray-600">{squad.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Squad Members
            </h3>
            <div className="space-y-3">
              {squad.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatarUrl || ''} />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {member.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {member.role === 'creator' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {member.age && `${member.age}y`}
                      {member.city && ` • ${member.city}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex gap-3">
        {squad.isMember ? (
          <>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleLeave}
              disabled={actionLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {squad.isCreator ? 'Cancel Squad' : 'Leave Squad'}
            </Button>
            <Button className="flex-1 bg-purple-600">
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </>
        ) : squad.status === 'open' ? (
          <Button 
            className="flex-1 bg-purple-600"
            onClick={handleJoin}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Join Squad
          </Button>
        ) : (
          <Button className="flex-1" disabled>
            Squad is Full
          </Button>
        )}
      </div>
    </div>
  )
}
