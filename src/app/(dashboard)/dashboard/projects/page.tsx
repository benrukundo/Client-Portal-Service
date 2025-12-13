import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Calendar, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/constants'

export default async function ProjectsPage() {
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
  })

  if (!workspaceMember) {
    return null
  }

  const projects = await prisma.project.findMany({
    where: {
      client: { workspaceId: workspaceMember.workspaceId },
    },
    include: {
      client: true,
      _count: {
        select: {
          updates: true,
          files: true,
          approvals: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            Manage all your client projects
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project from a client page.
            </p>
            <Link href="/dashboard/clients">
              <Button>Go to Clients</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.client.name}
                    </p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{project._count.updates} updates</span>
                      <span>{project._count.files} files</span>
                      <span>{project._count.approvals} approvals</span>
                      <span>{project._count.messages} messages</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {project.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due {formatDate(project.dueDate)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4" />
                      Created {formatDate(project.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
