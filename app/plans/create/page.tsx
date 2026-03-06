'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  ArrowLeft, 
  Search,
  Calendar,
  Clock,
  MapPin,
  Film
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { Suspense } from 'react'

interface Movie {
  id: string
  tmdb_id: number
  title: string
  poster_url: string
}

function CreatePlanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedMovieId = searchParams.get('movieId')

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0])
  const [plannedTime, setPlannedTime] = useState('')
  const [cinemaName, setCinemaName] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (preSelectedMovieId) {
      // Fetch movie details
      fetch(`/api/movies?id=${preSelectedMovieId}`)
        .then(res => res.json())
        .then(data => {
          if (data.movie) {
            setSelectedMovie(data.movie)
          }
        })
    }
  }, [preSelectedMovieId])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.movies || [])
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMovie) return

    setLoading(true)
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: selectedMovie.id,
          plannedDate,
          plannedTime: plannedTime || null,
          cinemaName: cinemaName || null,
          note: note || null,
        }),
      })

      if (response.ok) {
        router.push('/tonight')
      }
    } catch (err) {
      console.error('Error creating plan:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/tonight">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Create Movie Plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Movie Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="w-4 h-4" />
              Select Movie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMovie ? (
              <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                <img
                  src={selectedMovie.poster_url || '/placeholder-movie.png'}
                  alt={selectedMovie.title}
                  className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{selectedMovie.title}</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-purple-600"
                    onClick={() => setSelectedMovie(null)}
                  >
                    Change movie
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a movie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  />
                  <Button type="button" onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        className="text-left p-2 rounded hover:bg-gray-100 transition"
                        onClick={() => {
                          setSelectedMovie(movie)
                          setSearchResults([])
                        }}
                      >
                        <img
                          src={movie.poster_url || '/placeholder-movie.png'}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover rounded mb-1"
                        />
                        <p className="text-xs line-clamp-2">{movie.title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              When
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={addDays(new Date(), 7).toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Time (optional)</Label>
              <Input
                type="time"
                value={plannedTime}
                onChange={(e) => setPlannedTime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Where (optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Cinema name or location"
              value={cinemaName}
              onChange={(e) => setCinemaName(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Note */}
        <Card>
          <CardContent className="pt-6">
            <Label>Add a note (optional)</Label>
            <Textarea
              placeholder="Looking for someone who loves sci-fi too!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={!selectedMovie || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Plan'
          )}
        </Button>
      </form>
    </div>
  )
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <CreatePlanForm />
    </Suspense>
  )
}
