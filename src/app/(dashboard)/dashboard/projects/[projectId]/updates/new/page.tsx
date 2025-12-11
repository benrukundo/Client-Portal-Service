'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

interface NewUpdatePageProps {
  params: Promise<{ projectId: string }>
}

export default function NewUpdatePage({ params }: NewUpdatePageProps) {
  const { projectId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter update content')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create update')
      }

      toast.success('Update posted successfully!')
      router.push(`/dashboard/projects/${projectId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Update</CardTitle>
          <CardDescription>
            Share progress with the client. They will be notified of this update.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Update Content *</Label>
              <Textarea
                id="content"
                placeholder="Share what's been accomplished, what's coming next, or any important information..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                This update will be visible to the client in their portal.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Link href={`/dashboard/projects/${projectId}`}>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Update'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
