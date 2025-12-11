import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Plus, 
  Clock,
  FileText,
  CheckCircle,
  MessageSquare,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import { getInitials, formatDate, formatRelativeTime } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectPageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
  })

  if (!workspaceMember) {
    notFound()
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      client: { workspaceId: workspaceMember.workspaceId },
    },
    include: {
      client: true,
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
      case 'cancelled':
        return 'bg-red-100 text-red-700'
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
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/dashboard/clients/${project.clientId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {project.client.name}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Project</DropdownMenuItem>
            <DropdownMenuItem>Change Status</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <div className="flex justify-end">
            <Link href={`/dashboard/projects/${project.id}/updates/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post Update
              </Button>
            </Link>
          </div>

          {project.updates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Post your first update to keep the client informed.
                </p>
                <Link href={`/dashboard/projects/${project.id}/updates/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Post First Update
                  </Button>
                </Link>
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
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
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
        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>

          {project.files.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload files to share with the client.
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {project.files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {formatRelativeTime(file.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/dashboard/projects/${project.id}/approvals/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Approval
              </Button>
            </Link>
          </div>

          {project.approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approvals yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Request client approval on deliverables.
                </p>
                <Link href={`/dashboard/projects/${project.id}/approvals/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Request Approval
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {project.approvals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium">{approval.title}</h3>
                      {approval.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {approval.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested by {approval.requestedBy.name || approval.requestedBy.email} · {formatRelativeTime(approval.createdAt)}
                      </p>
                    </div>
                    <Badge className={getApprovalStatusColor(approval.status)}>
                      {approval.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {project.messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground text-center">
                  Messages with the client will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {project.messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.author.name || message.author.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {message.author.name || message.author.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(message.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
