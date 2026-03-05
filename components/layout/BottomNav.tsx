'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Heart, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/discover', icon: Film, label: 'Discover' },
  { href: '/movies', icon: Film, label: 'Movies' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't show on auth pages or chat
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/' ||
    pathname.startsWith('/chat/')
  ) {
    return null
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive && 'fill-purple-100'
                )}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
