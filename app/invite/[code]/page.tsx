'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Film, UserPlus, Check } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [inviter, setInviter] = useState<{ name: string; avatarUrl: string | null } | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    validateInvite()
  }, [code])

  const validateInvite = async () => {
    try {
      const response = await fetch(`/api/invites/${code}`)
      if (response.ok) {
        const data = await response.json()
        setValid(data.valid)
        setInviter(data.inviter)
      }
    } catch (err) {
      console.error('Error validating invite:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const response = await fetch(`/api/invites/${code}`, {
        method: 'POST',
      })
      if (response.ok) {
        setAccepted(true)
        setTimeout(() => router.push('/discover'), 2000)
      } else if (response.status === 401) {
        // Not logged in - redirect to signup with invite code
        router.push(`/signup?invite=${code}`)
      }
    } catch (err) {
      console.error('Error accepting invite:', err)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Invalid Invite</h1>
            <p className="text-gray-500 mb-6">
              This invite link is invalid or has already been used.
            </p>
            <Link href="/">
              <Button className="w-full bg-purple-600">
                Go to ScreenDate
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Welcome to ScreenDate!</h1>
            <p className="text-gray-500">
              Redirecting you to discover matches...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-purple-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>

          {inviter && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={inviter.avatarUrl || ''} />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                  {inviter.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-600">
                <strong>{inviter.name}</strong> invited you
              </span>
            </div>
          )}

          <p className="text-gray-500 mb-6">
            Join ScreenDate and find someone to watch movies with!
          </p>

          <div className="space-y-3">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Accept Invite
            </Button>

            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <Link href={`/signup?invite=${code}`} className="text-purple-600 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
