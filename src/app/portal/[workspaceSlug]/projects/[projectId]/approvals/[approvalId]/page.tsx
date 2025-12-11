'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ApprovalResponsePageProps {
  params: Promise<{ 
    workspaceSlug: string
    projectId: string
    approvalId: string 
  }>
}

interface Approval {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  requestedBy: {
    name: string | null
    email: string
  }
}

export default function ApprovalResponsePage({ params }: ApprovalResponsePageProps) {
  const { workspaceSlug, projectId, approvalId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [approval, setApproval] = useState<Approval | null>(null)
  const [responseNote, setResponseNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApproval() {
      try {
        const response = await fetch(`/api/approvals/${approvalId}`)
        if (response.ok) {
          const data = await response.json()
          setApproval(data)
        }
      } catch (error) {
        console.error('Error fetching approval:', error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchApproval()
  }, [approvalId])

  const handleSubmit = async (status: 'approved' | 'changes-requested' | 'rejected') => {
    setSelectedStatus(status)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/approvals/${approvalId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          responseNote,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit response')
      }

      toast.success('Response submitted successfully!')
      router.push(`/portal/${workspaceSlug}/projects/${projectId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
      setSelectedStatus(null)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!approval) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Approval request not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (approval.status !== 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/portal/${workspaceSlug}/projects/${projectId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Already Responded</p>
            <p className="text-muted-foreground mt-2">
              This approval request has already been {approval.status}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/portal/${workspaceSlug}/projects/${projectId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{approval.title}</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
          </div>
          {approval.description && (
            <CardDescription>{approval.description}</CardDescription>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Requested by {approval.requestedBy.name || approval.requestedBy.email}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responseNote">Feedback (Optional)</Label>
            <Textarea
              id="responseNote"
              placeholder="Add any comments or feedback..."
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleSubmit('approved')}
              disabled={isLoading}
            >
              {isLoading && selectedStatus === 'approved' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={() => handleSubmit('changes-requested')}
              disabled={isLoading}
            >
              {isLoading && selectedStatus === 'changes-requested' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              Request Changes
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleSubmit('rejected')}
              disabled={isLoading}
            >
              {isLoading && selectedStatus === 'rejected' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
