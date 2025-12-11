'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { generateSlug } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [brandColor, setBrandColor] = useState('#0066FF')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workspaceName.trim()) {
      toast.error('Please enter your agency name')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName,
          slug: generateSlug(workspaceName),
          brandColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create workspace')
      }

      toast.success('Workspace created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set up your workspace</CardTitle>
        <CardDescription>
          Let&apos;s create your agency workspace. You can customize these settings later.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Agency Name</Label>
            <Input
              id="workspaceName"
              placeholder="Acme Marketing"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed to your clients in their portal.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand Color</Label>
            <div className="flex gap-3">
              <Input
                id="brandColor"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={isLoading}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={isLoading}
                placeholder="#0066FF"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This color will be used throughout your client portal.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Your client portal URL:</p>
            <p className="text-sm text-muted-foreground font-mono">
              {process.env.NEXT_PUBLIC_APP_URL || 'https://app.clienthub.com'}/portal/
              <span className="text-foreground">
                {workspaceName ? generateSlug(workspaceName) : 'your-agency'}
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating workspace...
              </>
            ) : (
              'Create Workspace'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
