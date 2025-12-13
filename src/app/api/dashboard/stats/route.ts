import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!member) {
      return NextResponse.json({ message: 'No workspace found' }, { status: 404 })
    }

    const workspaceId = member.workspaceId

    // Get current date info for period comparisons
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Total counts
    const [
      totalClients,
      totalProjects,
      activeProjects,
      completedProjects,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalFiles,
      totalMessages,
      totalApprovals,
      pendingApprovals,
    ] = await Promise.all([
      prisma.client.count({ where: { workspaceId } }),
      prisma.project.count({ where: { client: { workspaceId } } }),
      prisma.project.count({ where: { client: { workspaceId }, status: 'active' } }),
      prisma.project.count({ where: { client: { workspaceId }, status: 'completed' } }),
      prisma.invoice.count({ where: { client: { workspaceId } } }),
      prisma.invoice.count({ where: { client: { workspaceId }, status: 'paid' } }),
      prisma.invoice.count({ where: { client: { workspaceId }, status: { in: ['sent', 'draft'] } } }),
      prisma.file.count({ where: { project: { client: { workspaceId } } } }),
      prisma.message.count({ where: { project: { client: { workspaceId } } } }),
      prisma.approvalRequest.count({ where: { project: { client: { workspaceId } } } }),
      prisma.approvalRequest.count({ where: { project: { client: { workspaceId } }, status: 'pending' } }),
    ])

    // Revenue calculations
    const revenueData = await prisma.invoice.findMany({
      where: {
        client: { workspaceId },
        status: 'paid',
      },
      select: {
        total: true,
        paidAt: true,
        createdAt: true,
      },
    })

    const totalRevenue = revenueData.reduce((sum, inv) => sum + inv.total, 0)

    const revenueThisMonth = revenueData
      .filter(inv => {
        const date = inv.paidAt || inv.createdAt
        return date >= startOfMonth
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    const revenueLastMonth = revenueData
      .filter(inv => {
        const date = inv.paidAt || inv.createdAt
        return date >= startOfLastMonth && date <= endOfLastMonth
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    const revenueThisYear = revenueData
      .filter(inv => {
        const date = inv.paidAt || inv.createdAt
        return date >= startOfYear
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    // Outstanding invoices amount
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        client: { workspaceId },
        status: { in: ['sent', 'draft'] },
      },
      select: { total: true },
    })
    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      where: { client: { workspaceId } },
      _count: { status: true },
    })

    // New clients this month
    const newClientsThisMonth = await prisma.client.count({
      where: {
        workspaceId,
        createdAt: { gte: startOfMonth },
      },
    })

    // New projects this month
    const newProjectsThisMonth = await prisma.project.count({
      where: {
        client: { workspaceId },
        createdAt: { gte: startOfMonth },
      },
    })

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthRevenue = revenueData
        .filter(inv => {
          const date = inv.paidAt || inv.createdAt
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, inv) => sum + inv.total, 0)

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        year: monthStart.getFullYear(),
        revenue: monthRevenue,
      })
    }

    // Recent projects with activity
    const recentProjects = await prisma.project.findMany({
      where: { client: { workspaceId } },
      include: {
        client: { select: { name: true } },
        _count: {
          select: {
            updates: true,
            files: true,
            approvals: true,
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Upcoming due dates
    const upcomingDueDates = await prisma.project.findMany({
      where: {
        client: { workspaceId },
        status: { in: ['active', 'not-started'] },
        dueDate: { gte: now },
      },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    // Overdue projects
    const overdueProjects = await prisma.project.count({
      where: {
        client: { workspaceId },
        status: { in: ['active', 'not-started'] },
        dueDate: { lt: now },
      },
    })

    return NextResponse.json({
      overview: {
        totalClients,
        totalProjects,
        activeProjects,
        completedProjects,
        newClientsThisMonth,
        newProjectsThisMonth,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        thisYear: revenueThisYear,
        outstanding: outstandingAmount,
        monthlyTrend: monthlyRevenue,
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
      },
      projects: {
        byStatus: projectsByStatus.map(p => ({
          status: p.status,
          count: p._count.status,
        })),
        overdueCount: overdueProjects,
        upcomingDueDates,
      },
      activity: {
        totalFiles,
        totalMessages,
        totalApprovals,
        pendingApprovals,
      },
      recentProjects,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
