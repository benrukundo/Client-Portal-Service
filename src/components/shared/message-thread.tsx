'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'

interface Message {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

interface MessageThreadProps {
  projectId: string
  initialMessages: Message[]
}

export function MessageThread({ projectId, initialMessages }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send message')
      }

      const newMessage = await response.json()
      setMessages((prev) => [...prev, newMessage])
      setContent('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 mb-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-center">
              Start a conversation about this project.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.author.name || message.author.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {message.author.name || message.author.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
