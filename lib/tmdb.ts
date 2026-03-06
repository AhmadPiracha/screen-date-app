// TMDB API Service
// Documentation: https://developer.themoviedb.org/reference/intro/getting-started

import { config } from './config'

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  popularity: number
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
}

export interface TMDBMovieResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface TMDBGenre {
  id: number
  name: string
}

const TMDB_BASE_URL = config.tmdb.baseUrl || 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = config.tmdb.imageBaseUrl || 'https://image.tmdb.org/t/p'

// Helper to get full poster URL
export function getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string | null {
  if (!posterPath) return null
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`
}

// Helper to get full backdrop URL
export function getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'): string | null {
  if (!backdropPath) return null
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`
}

// Fetch options helper
function getTMDBFetchOptions() {
  const apiKey = config.tmdb.apiKey
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured')
  }
  
  return {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  } as RequestInit & { next?: { revalidate: number } }
}

// Alternative: Use API key as query parameter
function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  const apiKey = config.tmdb.apiKey
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  
  // Use API key in query if no bearer token
  if (apiKey && !apiKey.startsWith('eyJ')) {
    url.searchParams.set('api_key', apiKey)
  }
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  
  return url.toString()
}

// Get now playing movies in India
export async function getNowPlayingMovies(page = 1): Promise<TMDBMovieResponse> {
  const url = buildUrl('/movie/now_playing', {
    region: 'IN',
    page: page.toString(),
    language: 'en-US',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  return response.json()
}

// Get popular movies in India
export async function getPopularMovies(page = 1): Promise<TMDBMovieResponse> {
  const url = buildUrl('/movie/popular', {
    region: 'IN',
    page: page.toString(),
    language: 'en-US',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  return response.json()
}

// Search movies by title
export async function searchMovies(query: string, page = 1): Promise<TMDBMovieResponse> {
  const url = buildUrl('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
    language: 'en-US',
    region: 'IN',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  return response.json()
}

// Get movie details by ID
export async function getMovieDetails(movieId: number): Promise<TMDBMovie & { genres: TMDBGenre[] }> {
  const url = buildUrl(`/movie/${movieId}`, {
    language: 'en-US',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  return response.json()
}

// Get movie genres list
export async function getGenres(): Promise<TMDBGenre[]> {
  const url = buildUrl('/genre/movie/list', {
    language: 'en-US',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.genres
}

// Get upcoming movies
export async function getUpcomingMovies(page = 1): Promise<TMDBMovieResponse> {
  const url = buildUrl('/movie/upcoming', {
    region: 'IN',
    page: page.toString(),
    language: 'en-US',
  })
  
  const response = await fetch(url, getTMDBFetchOptions())
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }
  
  return response.json()
}

// Transform TMDB movie to our database format
export function transformTMDBMovie(movie: TMDBMovie) {
  return {
    tmdb_id: movie.id,
    title: movie.title,
    poster_url: getPosterUrl(movie.poster_path, 'w500'),
    backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${movie.backdrop_path}` : null,
    release_date: movie.release_date || null,
    overview: movie.overview,
    popularity: movie.popularity,
    vote_average: movie.vote_average || 0,
    vote_count: movie.vote_count || 0,
  }
}

// Get genre IDs from a TMDB movie
export function getMovieGenreIds(movie: TMDBMovie): number[] {
  return movie.genre_ids || []
}
