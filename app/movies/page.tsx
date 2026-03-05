'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Check, X, Film, ArrowRight } from 'lucide-react'
import type { Movie } from '@/types'

export default function MoviesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())
  const [userMovieIds, setUserMovieIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMovies()
    fetchUserMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      const response = await fetch('/api/movies?limit=50')
      if (response.ok) {
        const data = await response.json()
        setMovies(data.movies || [])
        
        // If no movies, sync from TMDB
        if (!data.movies || data.movies.length === 0) {
          setSyncing(true)
          await fetch('/api/movies/sync', { method: 'POST' })
          const newResponse = await fetch('/api/movies?limit=50')
          if (newResponse.ok) {
            const newData = await newResponse.json()
            setMovies(newData.movies || [])
          }
          setSyncing(false)
        }
      }
    } catch (err) {
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserMovies = async () => {
    try {
      const response = await fetch('/api/users/movies')
      if (response.ok) {
        const data = await response.json()
        const ids = new Set<string>((data.movies || []).map((m: any) => m.movie_id))
        setUserMovieIds(ids)
        setSelectedMovies(ids)
      }
    } catch (err) {
      console.error('Error fetching user movies:', err)
    }
  }

  const toggleMovie = (movieId: string) => {
    setSelectedMovies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(movieId)) {
        newSet.delete(movieId)
      } else {
        if (newSet.size >= 10) {
          return prev // Max 10 movies
        }
        newSet.add(movieId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    if (selectedMovies.size < 1) {
      return
    }
    
    setSaving(true)
    
    try {
      // Remove movies that were deselected (in parallel)
      const toRemove = [...userMovieIds].filter((id) => !selectedMovies.has(id))
      await Promise.all(
        toRemove.map(movieId => 
          fetch(`/api/users/movies/${movieId}`, { method: 'DELETE' })
        )
      )

      // Add new movies (in parallel)
      const toAdd = [...selectedMovies].filter((id) => !userMovieIds.has(id))
      
      const results = await Promise.all(
        toAdd.map(async (movieId) => {
          const res = await fetch('/api/users/movies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: movieId }),
          })
          const data = await res.json()
          return { movieId, ok: res.ok || res.status === 409, error: data.error }
        })
      )

      const saveErrors = results.filter(r => !r.ok)

      if (saveErrors.length > 0) {
        alert('Some movies failed to save: ' + saveErrors.map(e => e.error).join(', '))
      } else {
        router.push('/discover')
      }
    } catch (err) {
      alert('Error saving movies: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || syncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-muted-foreground">
          {syncing ? 'Loading movies from TMDB...' : 'Loading...'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 pt-8 pb-6 px-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Select Movies
        </h1>
        <p className="text-white/80 text-center text-sm mb-4">
          Choose up to 10 movies you want to watch
        </p>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {selectedMovies.size} of 10 selected
          </p>
          <Badge variant={selectedMovies.size >= 1 ? 'default' : 'secondary'}>
            {selectedMovies.size >= 1 ? 'Ready to continue' : 'Select at least 1'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMovies.map((movie) => {
            const isSelected = selectedMovies.has(movie.id)
            return (
              <Card
                key={movie.id}
                onClick={() => toggleMovie(movie.id)}
                className={`cursor-pointer overflow-hidden transition-all ${
                  isSelected
                    ? 'ring-2 ring-purple-500 ring-offset-2'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className="relative aspect-[2/3]">
                  {movie.poster_url ? (
                    <Image
                      src={movie.poster_url}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Check className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-2">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <Film className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">No movies found</p>
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-white border-t z-40">
        <Button
          onClick={handleSave}
          disabled={selectedMovies.size < 1 || saving}
          className="w-full max-w-md mx-auto flex"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Discover
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
