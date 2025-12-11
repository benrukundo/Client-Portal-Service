import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText, CheckCircle, Receipt } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PortalPageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { workspaceSlug } = await params
  const session = await auth()

  // Get workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    redirect('/')
  }

  // If not logged in, redirect to portal login
  if (!session?.user?.id) {
    redirect(`/portal/${workspaceSlug}/login`)
  }

  // Get client contact for this user in this workspace
  const clientContact = await prisma.clientContact.findFirst({
    where: {
      userId: session.user.id,
      client: { workspaceId: workspace.id },
    },
    include: {
      client: {
        include: {
          projects: {
            include: {
              _count: {
                select: {
                  updates: true,
                  files: true,
                  approvals: true,
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          },
          invoices: {
            where: { status: { in: ['sent', 'overdue'] } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  // If user is not a client contact for this workspace, show error
  if (!clientContact) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have access to this portal. Please contact the agency if you believe this is an error.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const client = clientContact.client
  const activeProjects = client.projects.filter(p => p.status === 'active')
  const pendingApprovals = await prisma.approvalRequest.count({
    where: {
      project: { clientId: client.id },
      status: 'pending',
    },
  })

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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session.user.name || session.user.email}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your projects with {workspace.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        {client.projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center">
                Your projects will appear here once they're created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {client.projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/portal/${workspaceSlug}/projects/${project.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {project._count.updates} updates
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {project._count.approvals} approvals
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Last updated {formatDate(project.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
