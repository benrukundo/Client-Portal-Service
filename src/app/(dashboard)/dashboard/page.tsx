import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderOpen, Receipt, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
    include: { workspace: true },
  })

  if (!workspaceMember) {
    return null
  }

  const workspaceId = workspaceMember.workspaceId

  // Get counts
  const [clientsCount, projectsCount, pendingInvoices, activeProjects] = await Promise.all([
    prisma.client.count({ where: { workspaceId } }),
    prisma.project.count({
      where: { client: { workspaceId } },
    }),
    prisma.invoice.count({
      where: {
        client: { workspaceId },
        status: { in: ['sent', 'overdue'] },
      },
    }),
    prisma.project.count({
      where: {
        client: { workspaceId },
        status: 'active',
      },
    }),
  ])

  const stats = [
    {
      title: 'Total Clients',
      value: clientsCount,
      icon: Users,
      description: 'Active client accounts',
    },
    {
      title: 'Total Projects',
      value: projectsCount,
      icon: FolderOpen,
      description: 'All time projects',
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: Clock,
      description: 'Currently in progress',
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices,
      icon: Receipt,
      description: 'Awaiting payment',
    },
  ]

  // Get recent projects
  const recentProjects = await prisma.project.findMany({
    where: { client: { workspaceId } },
    include: { client: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your workspace activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest project activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No projects yet. Create your first client to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.client.name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
