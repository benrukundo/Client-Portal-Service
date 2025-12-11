'use client'

import { useState, use } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PortalLoginPageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default function PortalLoginPage({ params }: PortalLoginPageProps) {
  const { workspaceSlug } = use(params)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('resend', {
        email,
        redirect: false,
        callbackUrl: `/portal/${workspaceSlug}`,
      })

      if (result?.error) {
        toast.error('Something went wrong. Please try again.')
      } else {
        toast.success('Check your email for a login link!')
        setEmail('')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome to your Portal</CardTitle>
          <CardDescription>
            Enter your email to access your projects and updates
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
