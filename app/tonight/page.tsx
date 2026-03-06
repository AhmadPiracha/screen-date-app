'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Film, 
  Users,
  Plus,
  Heart,
  ChevronRight
} from 'lucide-react'
import { format, addDays } from 'date-fns'

interface MoviePlan {
  id: string
  plannedDate: string
  plannedTime: string | null
  cinemaName: string | null
  city: string | null
  maxCompanions: number
  note: string | null
  movie: {
    id: string
    title: string
    poster_url: string
  }
  user: {
    id: string
    name: string
    avatarUrl: string | null
    age: number | null
    gender: string | null
    city: string | null
  }
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
  movie: {
    id: string
    title: string
    poster_url: string
  }
  creator: {
    id: string
    name: string
    avatarUrl: string | null
  }
  members: Array<{
    id: string
    name: string
    avatarUrl: string | null
  }>
}

export default function TonightPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MoviePlan[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const dates = [
    { label: 'Today', value: new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', value: addDays(new Date(), 1).toISOString().split('T')[0] },
    { label: format(addDays(new Date(), 2), 'EEE'), value: addDays(new Date(), 2).toISOString().split('T')[0] },
  ]

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, squadsRes] = await Promise.all([
        fetch(`/api/plans?date=${selectedDate}`),
        fetch(`/api/squads?date=${selectedDate}`),
      ])

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || [])
      }

      if (squadsRes.ok) {
        const data = await squadsRes.json()
        setSquads(data.squads || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLikePlan = async (plan: MoviePlan) => {
    // Like the user from the plan
    try {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId: plan.user.id,
          liked: true,
        }),
      })
      // Remove from list
      setPlans(plans.filter(p => p.id !== plan.id))
    } catch (err) {
      console.error('Error liking user:', err)
    }
  }

  const handleJoinSquad = async (squadId: string) => {
    try {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: 'POST',
      })
      if (response.ok) {
        router.push(`/squads/${squadId}`)
      }
    } catch (err) {
      console.error('Error joining squad:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 pt-12 pb-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tonight's Plans</h1>
        <p className="text-gray-500 text-sm">Find someone to watch with</p>
      </div>

      {/* Date Selector */}
      <div className="px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="p-2">
            <div className="flex gap-2">
              {dates.map((date) => (
                <Button
                  key={date.value}
                  variant={selectedDate === date.value ? 'default' : 'ghost'}
                  size="sm"
                  className={selectedDate === date.value ? 'flex-1 bg-purple-600' : 'flex-1'}
                  onClick={() => setSelectedDate(date.value)}
                >
                  {date.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans" className="px-4 mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">
            <Users className="w-4 h-4 mr-2" />
            Solo Plans ({plans.length})
          </TabsTrigger>
          <TabsTrigger value="squads">
            <Film className="w-4 h-4 mr-2" />
            Squads ({squads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No movie plans for this day yet</p>
              <Link href="/movies">
                <Button className="mt-4 bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create a Plan
                </Button>
              </Link>
            </div>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Movie Poster */}
                    <div className="w-24 h-36 flex-shrink-0">
                      <img
                        src={plan.movie.poster_url || '/placeholder-movie.png'}
                        alt={plan.movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={plan.user.avatarUrl || ''} />
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                              {plan.user.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{plan.user.name}</p>
                            <p className="text-xs text-gray-500">
                              {plan.user.age && `${plan.user.age}y`}
                              {plan.user.gender && ` • ${plan.user.gender}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600"
                          onClick={() => handleLikePlan(plan)}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="font-semibold mt-2 text-sm line-clamp-1">
                        {plan.movie.title}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {plan.plannedTime && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {plan.plannedTime.slice(0, 5)}
                          </Badge>
                        )}
                        {plan.cinemaName && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {plan.cinemaName}
                          </Badge>
                        )}
                      </div>

                      {plan.note && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          "{plan.note}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="squads" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : squads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No movie squads for this day</p>
              <Link href="/squads/create">
                <Button className="mt-4 bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create a Squad
                </Button>
              </Link>
            </div>
          ) : (
            squads.map((squad) => (
              <Card key={squad.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Movie Poster */}
                    <div className="w-24 h-36 flex-shrink-0 relative">
                      <img
                        src={squad.movie.poster_url || '/placeholder-movie.png'}
                        alt={squad.movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {squad.currentMembers}/{squad.maxMembers}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{squad.name}</p>
                          <p className="text-sm text-gray-500">{squad.movie.title}</p>
                        </div>
                        <Badge 
                          variant={squad.status === 'open' ? 'default' : 'secondary'}
                          className={squad.status === 'open' ? 'bg-green-500' : ''}
                        >
                          {squad.status === 'open' ? 'Open' : 'Full'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {squad.plannedTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {squad.plannedTime.slice(0, 5)}
                          </Badge>
                        )}
                        {squad.cinemaName && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {squad.cinemaName}
                          </Badge>
                        )}
                      </div>

                      {/* Members */}
                      <div className="flex items-center mt-3">
                        <div className="flex -space-x-2">
                          {squad.members.slice(0, 4).map((member) => (
                            <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={member.avatarUrl || ''} />
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                {member.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {squad.members.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              +{squad.members.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="ml-auto">
                          {squad.status === 'open' ? (
                            <Button
                              size="sm"
                              onClick={() => handleJoinSquad(squad.id)}
                            >
                              Join
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <Link href={`/squads/${squad.id}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* FAB */}
      <Link href="/plans/create">
        <Button
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  )
}
