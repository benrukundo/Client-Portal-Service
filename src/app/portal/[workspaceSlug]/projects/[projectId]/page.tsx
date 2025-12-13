import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageThread } from '@/components/shared/message-thread'
import { PortalFilesList } from '@/components/portal/portal-files-list'
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  MessageSquare,
  Calendar,
  Clock,
  Download
} from 'lucide-react'
import { getInitials, formatDate, formatRelativeTime } from '@/lib/utils'

interface PortalProjectPageProps {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}

export default async function PortalProjectPage({ params }: PortalProjectPageProps) {
  const { workspaceSlug, projectId } = await params
  const session = await auth()

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    notFound()
  }

  if (!session?.user?.id) {
    redirect(`/portal/${workspaceSlug}/login`)
  }

  // Verify user has access to this project
  const clientContact = await prisma.clientContact.findFirst({
    where: {
      userId: session.user.id,
      client: { workspaceId: workspace.id },
    },
  })

  if (!clientContact) {
    redirect(`/portal/${workspaceSlug}`)
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: clientContact.clientId,
    },
    include: {
      updates: {
        include: {
          author: true,
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      files: {
        include: { uploadedBy: true },
        orderBy: { createdAt: 'desc' },
      },
      approvals: {
        include: {
          requestedBy: true,
          respondedBy: true,
          files: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      messages: {
        include: { author: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'changes-requested':
        return 'bg-orange-100 text-orange-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/portal/${workspaceSlug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        {project.description && (
          <p className="text-muted-foreground mt-2">{project.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {project.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Started {formatDate(project.startDate)}
            </span>
          )}
          {project.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Due {formatDate(project.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Updates ({project.updates.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files ({project.files.length})
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals ({project.approvals.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages ({project.messages.length})
          </TabsTrigger>
        </TabsList>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {project.updates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
                <p className="text-muted-foreground text-center">
                  Project updates will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.updates.map((update) => (
                <Card key={update.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(update.author.name || update.author.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {update.author.name || update.author.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(update.createdAt)}
                          </p>
                        </div>
                        <div 
                          className="mt-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: update.content }}
                        />
                        {update.attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {update.attachments.map((file) => (
                              <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                              >
                                <Download className="h-3 w-3" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
            </CardHeader>
            <CardContent>
              <PortalFilesList projectId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          {project.approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approvals yet</h3>
                <p className="text-muted-foreground text-center">
                  Approval requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.approvals.map((approval) => (
                <Card key={approval.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{approval.title}</CardTitle>
                      <Badge className={getApprovalStatusColor(approval.status)}>
                        {approval.status}
                      </Badge>
                    </div>
                    {approval.description && (
                      <p className="text-muted-foreground">{approval.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {approval.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {approval.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                          >
                            <Download className="h-3 w-3" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                    {approval.status === 'pending' && (
                      <div className="flex gap-2">
                        <Link href={`/portal/${workspaceSlug}/projects/${projectId}/approvals/${approval.id}`}>
                          <Button>Review & Respond</Button>
                        </Link>
                      </div>
                    )}
                    {approval.responseNote && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Response:</p>
                        <p className="text-sm text-muted-foreground">{approval.responseNote}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Requested {formatRelativeTime(approval.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <MessageThread
            projectId={project.id}
            initialMessages={project.messages.map(m => ({
              id: m.id,
              content: m.content,
              createdAt: m.createdAt.toISOString(),
              author: {
                id: m.author.id,
                name: m.author.name,
                email: m.author.email,
                avatar: m.author.avatar,
              },
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
