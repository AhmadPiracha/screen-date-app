'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Heart, MessageCircle, Flag, Film, Shield, TrendingUp, UserCheck } from 'lucide-react'

interface Analytics {
  totalUsers: number
  activeUsers: number
  totalMatches: number
  totalMessages: number
  totalReports: number
  blockedUsers: number
  totalMovies: number
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) throw new Error('Failed to fetch analytics')
        const data = await response.json()
        setAnalytics(data.analytics)
      } catch (err) {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-200 rounded-t-lg" />
            <CardContent className="h-16 bg-gray-100" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Active Users (7d)',
      value: analytics?.activeUsers || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Total Matches',
      value: analytics?.totalMatches || 0,
      icon: Heart,
      color: 'bg-pink-500',
      change: '+23%',
    },
    {
      title: 'Total Messages',
      value: analytics?.totalMessages || 0,
      icon: MessageCircle,
      color: 'bg-purple-500',
      change: '+18%',
    },
    {
      title: 'Open Reports',
      value: analytics?.totalReports || 0,
      icon: Flag,
      color: 'bg-orange-500',
      change: analytics?.totalReports ? 'Action needed' : 'All clear',
    },
    {
      title: 'Blocked Users',
      value: analytics?.blockedUsers || 0,
      icon: Shield,
      color: 'bg-red-500',
    },
    {
      title: 'Movies in DB',
      value: analytics?.totalMovies || 0,
      icon: Film,
      color: 'bg-indigo-500',
    },
    {
      title: 'Match Rate',
      value: analytics?.totalUsers 
        ? `${Math.round((analytics.totalMatches / analytics.totalUsers) * 100)}%` 
        : '0%',
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Overview of your platform metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className={`text-xs ${
                  stat.change.includes('+') 
                    ? 'text-green-600' 
                    : stat.change === 'Action needed' 
                      ? 'text-orange-600' 
                      : 'text-gray-500'
                }`}>
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  {analytics?.activeUsers || 0} users active in the last 7 days
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-pink-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  {analytics?.totalMatches || 0} total matches created
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  {analytics?.totalMessages || 0} messages exchanged
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {(analytics?.totalReports || 0) > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending reports</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    {analytics?.totalReports}
                  </span>
                </div>
                <a 
                  href="/admin/reports" 
                  className="block text-sm text-purple-600 hover:underline"
                >
                  View all reports →
                </a>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No pending reports</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
