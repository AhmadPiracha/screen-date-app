'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Copy,
  Share2,
  UserPlus,
  Check,
  Gift
} from 'lucide-react'
import { format } from 'date-fns'

interface Invite {
  id: string
  invite_code: string
  status: string
  created_at: string
  accepted_at: string | null
  invitee: {
    profiles: {
      name: string
      avatar_url: string | null
    }
  } | null
}

export default function InvitesPage() {
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<Invite[]>([])
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0 })
  const [creating, setCreating] = useState(false)
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/invites')
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites || [])
        setStats(data.stats || { total: 0, accepted: 0, pending: 0 })
      }
    } catch (err) {
      console.error('Error fetching invites:', err)
    } finally {
      setLoading(false)
    }
  }

  const createInvite = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setNewInviteUrl(data.inviteUrl)
        fetchInvites()
      }
    } catch (err) {
      console.error('Error creating invite:', err)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareInvite = async (url: string) => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join me on ScreenDate!',
        text: 'Find someone to watch movies with',
        url,
      })
    } else {
      copyToClipboard(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Invite Friends</h1>
        </div>
        <p className="text-purple-100 text-sm">Invite friends to join ScreenDate</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Invites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              <p className="text-xs text-gray-500">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Invite */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="font-semibold mb-2">Share ScreenDate</h2>
              <p className="text-sm text-gray-500 mb-4">
                Create an invite link to share with friends
              </p>

              {newInviteUrl ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInviteUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newInviteUrl)}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4111 h-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-purple-600"
                      onClick={() => shareInvite(newInviteUrl)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setNewInviteUrl(null)}
                    >
                      New Link
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full bg-purple-600"
                  onClick={createInvite}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Create Invite Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invite History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No invites yet. Create your first one!
              </p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {invite.invitee ? (
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={invite.invitee.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {invite.invitee.profiles?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {invite.invitee?.profiles?.name || invite.invite_code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(invite.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={invite.status === 'accepted' ? 'default' : 'secondary'}
                    className={invite.status === 'accepted' ? 'bg-green-500' : ''}
                  >
                    {invite.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
