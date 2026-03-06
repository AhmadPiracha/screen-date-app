'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Loader2,
  Search,
  Check,
  Film,
  ArrowRight,
  SlidersHorizontal,
  Star,
  X,
  Flame,
  Clock,
  Calendar,
  Trophy,
} from 'lucide-react'
import type { Movie, Genre } from '@/types'

const CATEGORIES = [
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'now_playing', label: 'Now Playing', icon: Clock },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy },
]

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString())

const RATINGS = [
  { value: '0', label: 'Any' },
  { value: '6', label: '6+' },
  { value: '7', label: '7+' },
  { value: '8', label: '8+' },
  { value: '9', label: '9+' },
]

export default function MoviesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())
  const [userMovieIds, setUserMovieIds] = useState<Set<string>>(new Set())
  
  // Filter states
  const [category, setCategory] = useState('popular')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [minRating, setMinRating] = useState<string>('0')
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = [
    selectedGenre,
    selectedYear,
    minRating !== '0' ? minRating : null,
  ].filter(Boolean).length

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres')
      if (response.ok) {
        const data = await response.json()
        setGenres(data.genres || [])
      }
    } catch (err) {
      console.error('Error fetching genres:', err)
    }
  }

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        category,
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedYear && { year: selectedYear }),
        ...(minRating !== '0' && { minRating }),
        ...(searchQuery && { search: searchQuery }),
      })
      
      const response = await fetch(`/api/movies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMovies(data.movies || [])
        
        // If no movies and popular category, sync from TMDB
        if ((!data.movies || data.movies.length === 0) && category === 'popular' && !searchQuery) {
          setSyncing(true)
          await fetch('/api/movies/sync', { method: 'POST' })
          const newResponse = await fetch(`/api/movies?${params}`)
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
  }, [category, selectedGenre, selectedYear, minRating, searchQuery])

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

  useEffect(() => {
    fetchGenres()
    fetchUserMovies()
  }, [])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

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
      // Remove movies that were deselected
      const toRemove = [...userMovieIds].filter((id) => !selectedMovies.has(id))
      await Promise.all(
        toRemove.map(movieId => 
          fetch(`/api/users/movies/${movieId}`, { method: 'DELETE' })
        )
      )

      // Add new movies
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

  const clearFilters = () => {
    setSelectedGenre(null)
    setSelectedYear(null)
    setMinRating('0')
  }

  if (syncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-muted-foreground">Loading movies from TMDB...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 pt-8 pb-4 px-4 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          Movies
        </h1>
        <p className="text-white/80 text-center text-sm mb-4">
          Select up to 10 movies you want to watch
        </p>
        
        {/* Search bar with filter button */}
        <div className="flex gap-2 max-w-md mx-auto mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90"
            />
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="relative">
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Genre */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Genre
                  </label>
                  <Select
                    value={selectedGenre || 'all'}
                    onValueChange={(v) => setSelectedGenre(v === 'all' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All genres</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id.toString()}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Release Year
                  </label>
                  <Select
                    value={selectedYear || 'all'}
                    onValueChange={(v) => setSelectedYear(v === 'all' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Minimum Rating
                  </label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATINGS.map((rating) => (
                        <SelectItem key={rating.value} value={rating.value}>
                          {rating.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category tabs */}
        <Tabs value={category} onValueChange={setCategory} className="w-full">
          <TabsList className="w-full bg-white/20 h-auto p-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-white/80"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {cat.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Genre chips (horizontal scroll) */}
      <div className="border-b bg-white">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 p-3">
            <Button
              variant={selectedGenre === null ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setSelectedGenre(null)}
            >
              All
            </Button>
            {genres.slice(0, 12).map((genre) => (
              <Button
                key={genre.id}
                variant={selectedGenre === genre.id.toString() ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setSelectedGenre(
                  selectedGenre === genre.id.toString() ? null : genre.id.toString()
                )}
              >
                {genre.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 border-b">
          <span className="text-sm text-muted-foreground">Active:</span>
          {selectedGenre && (
            <Badge variant="secondary" className="gap-1">
              {genres.find(g => g.id.toString() === selectedGenre)?.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedGenre(null)}
              />
            </Badge>
          )}
          {selectedYear && (
            <Badge variant="secondary" className="gap-1">
              {selectedYear}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedYear(null)}
              />
            </Badge>
          )}
          {minRating !== '0' && (
            <Badge variant="secondary" className="gap-1">
              {minRating}+ ★
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setMinRating('0')}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Selection status */}
      <div className="p-4 bg-white border-b sticky top-[200px] z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedMovies.size} of 10 selected
          </p>
          <Badge variant={selectedMovies.size >= 1 ? 'default' : 'secondary'}>
            {selectedMovies.size >= 1 ? 'Ready to continue' : 'Select at least 1'}
          </Badge>
        </div>
      </div>

      {/* Movies grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">No movies found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.map((movie) => {
              const isSelected = selectedMovies.has(movie.id)
              return (
                <Card
                  key={movie.id}
                  onClick={() => toggleMovie(movie.id)}
                  className={`cursor-pointer overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-2 ring-purple-500 ring-offset-2'
                      : 'hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="relative aspect-[2/3]">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Film className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Rating badge */}
                    {movie.vote_average && movie.vote_average > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {movie.vote_average.toFixed(1)}
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
