/**
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis-based solutions like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 * @param identifier Unique identifier (usually user ID or IP)
 * @param action Action being rate limited (e.g., 'like', 'message')
 * @param config Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${action}:${identifier}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // If no entry or entry expired, create new one
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowSeconds * 1000
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      success: true,
      remaining: config.limit - 1,
      reset: resetTime,
    }
  }

  // Check if over limit
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  }
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  /** Max 50 likes per hour */
  likes: { limit: 50, windowSeconds: 3600 },
  /** Max 100 messages per hour */
  messages: { limit: 100, windowSeconds: 3600 },
  /** Max 10 reports per day */
  reports: { limit: 10, windowSeconds: 86400 },
  /** Max 5 login attempts per 15 minutes */
  login: { limit: 5, windowSeconds: 900 },
  /** Max 3 signup attempts per hour */
  signup: { limit: 3, windowSeconds: 3600 },
} as const

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
  return {
    error: 'Too many requests',
    retryAfter,
    reset: new Date(result.reset).toISOString(),
  }
}
