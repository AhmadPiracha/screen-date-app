'use client'

import { useState, memo } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import Image from 'next/image'
import { Heart, X, Film, MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DiscoverProfile, Movie } from '@/types'

interface SwipeCardProps {
  profile: DiscoverProfile
  onSwipe: (direction: 'left' | 'right') => void
  isTop: boolean
}

export const SwipeCard = memo(function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  
  // Color overlays for like/dislike feedback
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100
    
    if (info.offset.x > threshold) {
      setExitX(500)
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      setExitX(-500)
      onSwipe('left')
    }
  }

  return (
    <motion.div
      className="absolute w-full max-w-sm"
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Profile Image */}
        <div className="relative h-[400px]">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              className="object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-purple-500 flex items-center justify-center">
              <span className="text-8xl text-white font-bold">
                {profile.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          
          {/* Like overlay */}
          <motion.div
            className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
            style={{ opacity: likeOpacity }}
          >
            <div className="border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-20deg]">
              <span className="text-green-500 text-4xl font-bold">LIKE</span>
            </div>
          </motion.div>
          
          {/* Nope overlay */}
          <motion.div
            className="absolute inset-0 bg-red-500/30 flex items-center justify-center"
            style={{ opacity: nopeOpacity }}
          >
            <div className="border-4 border-red-500 rounded-lg px-4 py-2 rotate-[20deg]">
              <span className="text-red-500 text-4xl font-bold">NOPE</span>
            </div>
          </motion.div>
          
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Name and age */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-bold">
              {profile.name}{profile.age && <span>, {profile.age}</span>}
            </h2>
            {profile.city && (
              <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {profile.city}
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="p-4">
          {profile.bio && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          {/* Common movies */}
          {profile.commonMovies && profile.commonMovies.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Film className="w-3 h-3" />
                Movies in common
              </p>
              <div className="space-y-1.5">
                {profile.commonMovies.slice(0, 2).map((movie) => (
                  <div key={movie.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                    <span className="text-xs font-medium text-gray-800 truncate max-w-[140px]">{movie.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {movie.vote_average != null && movie.vote_average > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {movie.vote_average.toFixed(1)}
                        </span>
                      )}
                      {movie.genres && movie.genres.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {movie.genres[0].name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {profile.commonMovies.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{profile.commonMovies.length - 2} more in common
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

interface ActionButtonsProps {
  onLike: () => void
  onDislike: () => void
  disabled?: boolean
}

export const ActionButtons = memo(function ActionButtons({ onLike, onDislike, disabled }: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-8 mt-6">
      <button
        onClick={onDislike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <X className="w-8 h-8 text-red-500" />
      </button>
      
      <button
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
      >
        <Heart className="w-8 h-8 text-green-500" />
      </button>
    </div>
  )
})
