'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Clapperboard, Heart, User, Shield, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/tonight', icon: Calendar, label: 'Tonight' },
  { href: '/movies', icon: Clapperboard, label: 'Movies' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Cache admin check in sessionStorage to avoid a network request on every page
    const cached = sessionStorage.getItem('isAdmin')
    if (cached !== null) {
      setIsAdmin(cached === 'true')
      return
    }

    fetch('/api/admin/analytics')
      .then((res) => {
        const result = res.ok
        setIsAdmin(result)
        sessionStorage.setItem('isAdmin', String(result))
      })
      .catch(() => {
        setIsAdmin(false)
        sessionStorage.setItem('isAdmin', 'false')
      })
  }, [])

  // Don't show on auth pages or chat
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/' ||
    pathname.startsWith('/chat/') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  const allNavItems = isAdmin
    ? [...navItems, { href: '/admin', icon: Shield, label: 'Admin' }]
    : navItems

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {allNavItems.map(({ href, icon: Icon, label }) => {
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
