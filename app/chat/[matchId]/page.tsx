'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Send, MoreVertical, Flag, Ban } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Message, Profile } from '@/types'
import { format, isToday, isYesterday } from 'date-fns'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string
  
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    try {
      const [messagesRes, userRes] = await Promise.all([
        fetch(`/api/messages?matchId=${matchId}`),
        fetch('/api/users/me'),
      ])
      
      let userId: string | null = null
      
      if (userRes.ok) {
        const userData = await userRes.json()
        userId = userData.user?.id || userData.id
        setCurrentUserId(userId)
      }
      
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        // Filter out any undefined/null messages
        const validMessages = (data.messages || []).filter((m: any) => m && m.id)
        setMessages(validMessages)
      } else if (messagesRes.status === 404) {
        // Match not found - redirect to matches
        router.push('/matches')
        return
      }
      
      // Get match details to find other user info
      const conversationsRes = await fetch('/api/conversations')
      if (conversationsRes.ok) {
        const convData = await conversationsRes.json()
        const conv = (convData.conversations || []).find((c: any) => c.matchId === matchId)
        if (conv?.otherUserProfile) {
          setOtherUser(conv.otherUserProfile)
        }
      }
    } catch (err) {
      console.error('Error fetching chat:', err)
    } finally {
      setLoading(false)
    }
  }, [matchId, router])

  useEffect(() => {
    fetchMessages()
    
    // Poll for new messages every 5 seconds, but only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          content: messageText,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.message && data.message.id) {
          setMessages((prev) => [...prev, data.message])
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setNewMessage(messageText) // Restore message on error
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleBlock = async () => {
    if (!otherUser) return
    
    try {
      await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: otherUser.user_id }),
      })
      router.push('/matches')
    } catch (err) {
      console.error('Error blocking user:', err)
    }
  }

  const handleReport = async () => {
    if (!otherUser) return
    
    try {
      await fetch('/api/users/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: otherUser.user_id,
          reason: 'inappropriate_behavior',
        }),
      })
      setShowReportDialog(false)
    } catch (err) {
      console.error('Error reporting user:', err)
    }
  }

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a')
    return format(date, 'MMM d, h:mm a')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link href="/matches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherUser?.avatar_url || ''} />
          <AvatarFallback className="bg-purple-100 text-purple-600">
            {otherUser?.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold">{otherUser?.name || 'Chat'}</h2>
          {otherUser?.city && (
            <p className="text-xs text-muted-foreground">{otherUser.city}</p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
              <Flag className="w-4 h-4 mr-2" />
              Report User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowBlockDialog(true)}
              className="text-red-600"
            >
              <Ban className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-purple-500 text-white rounded-br-sm'
                      : 'bg-white border rounded-bl-sm'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-purple-200' : 'text-muted-foreground'
                    }`}
                  >
                    {formatMessageDate(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to message you or see your profile anymore.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-red-500 hover:bg-red-600">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this user?</AlertDialogTitle>
            <AlertDialogDescription>
              Our team will review this report. Thank you for helping keep our
              community safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport}>
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
