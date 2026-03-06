// Database Types

export interface User {
  id: string
  phone: string | null
  is_verified: boolean
  city: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  name: string
  gender: 'male' | 'female' | 'other' | null
  looking_for_gender: 'male' | 'female' | 'any' | null
  age: number | null
  avatar_url: string | null
  bio: string | null
  city?: string
  created_at: string
  updated_at: string
}

export interface Genre {
  id: number
  name: string
}

export interface Movie {
  id: string
  tmdb_id: number
  title: string
  poster_url: string | null
  backdrop_url?: string | null
  release_date: string | null
  overview: string | null
  popularity: number | null
  vote_average?: number | null
  vote_count?: number | null
  genres?: Genre[]
  genre_ids?: number[]
  created_at: string
  updated_at: string
}

export interface UserMovie {
  id: string
  user_id: string
  movie_id: string
  added_at: string
  movie?: Movie
}

export interface Like {
  id: string
  from_user_id: string
  to_user_id: string
  liked: boolean
  liked_at: string
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  movie_id: string | null
  created_at: string
  matchedUser?: Profile
  matchedUserId?: string
  movie?: Movie
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  description: string | null
  created_at: string
}

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_user_id: string
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

// Discovery Types
export interface DiscoverProfile extends Profile {
  commonMovies?: Movie[]
  commonMovieCount?: number
  distance?: number
}

// Conversation Type
export interface Conversation {
  matchId: string
  otherUserId: string
  otherUserProfile: Profile | null
  connectedAt: string
  lastMessage: string | null
  lastMessageTime: string | null
}
