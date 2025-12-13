import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ProjectsOverview } from '@/components/dashboard/projects-overview'
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  FolderKanban,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

async function getDashboardStats(workspaceId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalClients,
    totalProjects,
    activeProjects,
    completedProjects,
    newClientsThisMonth,
    newProjectsThisMonth,
  ] = await Promise.all([
    prisma.client.count({ where: { workspaceId } }),
    prisma.project.count({ where: { client: { workspaceId } } }),
    prisma.project.count({ where: { client: { workspaceId }, status: 'active' } }),
    prisma.project.count({ where: { client: { workspaceId }, status: 'completed' } }),
    prisma.client.count({ where: { workspaceId, createdAt: { gte: startOfMonth } } }),
    prisma.project.count({ where: { client: { workspaceId }, createdAt: { gte: startOfMonth } } }),
  ])

  // Revenue data
  const paidInvoices = await prisma.invoice.findMany({
    where: { client: { workspaceId }, status: 'paid' },
    select: { total: true, paidAt: true, createdAt: true },
  })

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const revenueThisMonth = paidInvoices
    .filter(inv => (inv.paidAt || inv.createdAt) >= startOfMonth)
    .reduce((sum, inv) => sum + inv.total, 0)
  const revenueLastMonth = paidInvoices
    .filter(inv => {
      const date = inv.paidAt || inv.createdAt
      return date >= startOfLastMonth && date <= endOfLastMonth
    })
    .reduce((sum, inv) => sum + inv.total, 0)

  // Outstanding amount
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { client: { workspaceId }, status: { in: ['sent', 'draft'] } },
    select: { total: true },
  })
  const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0)

  // Pending approvals
  const pendingApprovals = await prisma.approvalRequest.count({
    where: { project: { client: { workspaceId } }, status: 'pending' },
  })

  // Projects by status
  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: { client: { workspaceId } },
    _count: { status: true },
  })

  // Overdue projects
  const overdueProjects = await prisma.project.count({
    where: {
      client: { workspaceId },
      status: { in: ['active', 'not-started'] },
      dueDate: { lt: now },
    },
  })

  // Upcoming deadlines
  const upcomingDueDates = await prisma.project.findMany({
    where: {
      client: { workspaceId },
      status: { in: ['active', 'not-started'] },
      dueDate: { gte: now },
    },
    include: { client: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Recent projects
  const recentProjects = await prisma.project.findMany({
    where: { client: { workspaceId } },
    include: {
      client: { select: { name: true } },
      _count: { select: { updates: true, files: true, approvals: true, messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  // Monthly revenue (last 6 months)
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const revenue = paidInvoices
      .filter(inv => {
        const date = inv.paidAt || inv.createdAt
        return date >= monthStart && date <= monthEnd
      })
      .reduce((sum, inv) => sum + inv.total, 0)
    monthlyRevenue.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      year: monthStart.getFullYear(),
      revenue,
    })
  }

  return {
    totalClients,
    totalProjects,
    activeProjects,
    completedProjects,
    newClientsThisMonth,
    newProjectsThisMonth,
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    outstandingAmount,
    pendingApprovals,
    projectsByStatus: projectsByStatus.map(p => ({ status: p.status, count: p._count.status })),
    overdueProjects,
    upcomingDueDates,
    recentProjects,
    monthlyRevenue,
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true, user: true },
  })

  if (!member) {
    redirect('/onboarding')
  }

  const stats = await getDashboardStats(member.workspaceId)

  const revenueGrowth = stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : stats.revenueThisMonth > 0 ? 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {member.user.name || member.user.email.split('@')[0]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
          description={stats.newClientsThisMonth > 0 ? `+${stats.newClientsThisMonth} this month` : undefined}
          icon={Users}
        />
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          description={`${stats.totalProjects} total projects`}
          icon={FolderKanban}
        />
        <StatsCard
          title="Revenue This Month"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={DollarSign}
          trend={revenueGrowth !== 0 ? {
            value: Math.round(revenueGrowth),
            isPositive: revenueGrowth > 0,
          } : undefined}
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingAmount)}
          description="Unpaid invoices"
          icon={TrendingUp}
        />
      </div>

      {/* Alerts Row */}
      {(stats.pendingApprovals > 0 || stats.overdueProjects > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.pendingApprovals > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats.pendingApprovals} Pending Approval{stats.pendingApprovals !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-yellow-600">Waiting for client response</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.overdueProjects > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800">
                    {stats.overdueProjects} Overdue Project{stats.overdueProjects !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-600">Past their due date</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={stats.monthlyRevenue} />
        <ProjectsOverview
          data={stats.projectsByStatus}
          total={stats.totalProjects}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingDeadlines
          projects={stats.upcomingDueDates as any}
          overdueCount={stats.overdueProjects}
        />
        <RecentProjects projects={stats.recentProjects as any} />
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed limit={10} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
