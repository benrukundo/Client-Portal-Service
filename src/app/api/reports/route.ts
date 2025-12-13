import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusLabel } from '@/lib/constants'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!member) {
      return NextResponse.json({ message: 'No workspace found' }, { status: 404 })
    }

    const workspaceId = member.workspaceId
    const dateFilter: any = {}

    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    let reportData: any = {}

    switch (type) {
      case 'summary':
        reportData = await generateSummaryReport(workspaceId, dateFilter)
        break
      case 'revenue':
        reportData = await generateRevenueReport(workspaceId, dateFilter)
        break
      case 'projects':
        reportData = await generateProjectsReport(workspaceId, dateFilter)
        break
      case 'clients':
        reportData = await generateClientsReport(workspaceId, dateFilter)
        break
      default:
        return NextResponse.json({ message: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({
      type,
      workspace: member.workspace.name,
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate || 'All time',
        end: endDate || 'Present',
      },
      data: reportData,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

async function generateSummaryReport(workspaceId: string, dateFilter: any) {
  const [clients, projects, invoices] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId, ...(dateFilter.gte && { createdAt: dateFilter }) },
      include: { _count: { select: { projects: true } } },
    }),
    prisma.project.findMany({
      where: {
        client: { workspaceId },
        ...(dateFilter.gte && { createdAt: dateFilter }),
      },
      include: { client: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: {
        client: { workspaceId },
        ...(dateFilter.gte && { createdAt: dateFilter }),
      },
    }),
  ])

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0)

  return {
    overview: {
      totalClients: clients.length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
    },
    financial: {
      totalRevenue,
      outstanding,
      averageInvoice: invoices.length > 0 ? totalRevenue / invoices.filter(i => i.status === 'paid').length : 0,
    },
  }
}

async function generateRevenueReport(workspaceId: string, dateFilter: any) {
  const invoices = await prisma.invoice.findMany({
    where: {
      client: { workspaceId },
      ...(dateFilter.gte && { createdAt: dateFilter }),
    },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const byClient = invoices.reduce((acc: any, inv) => {
    const clientName = inv.client.name
    if (!acc[clientName]) {
      acc[clientName] = { total: 0, paid: 0, pending: 0, count: 0 }
    }
    acc[clientName].total += inv.total
    acc[clientName].count += 1
    if (inv.status === 'paid') {
      acc[clientName].paid += inv.total
    } else {
      acc[clientName].pending += inv.total
    }
    return acc
  }, {})

  return {
    invoices: invoices.map(inv => ({
      number: inv.number,
      client: inv.client.name,
      amount: inv.total,
      status: inv.status,
      createdAt: inv.createdAt,
      paidAt: inv.paidAt,
    })),
    byClient: Object.entries(byClient).map(([name, data]: [string, any]) => ({
      client: name,
      ...data,
    })),
    totals: {
      total: invoices.reduce((sum, i) => sum + i.total, 0),
      paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      pending: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0),
    },
  }
}

async function generateProjectsReport(workspaceId: string, dateFilter: any) {
  const projects = await prisma.project.findMany({
    where: {
      client: { workspaceId },
      ...(dateFilter.gte && { createdAt: dateFilter }),
    },
    include: {
      client: { select: { name: true } },
      _count: { select: { updates: true, files: true, approvals: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const byStatus = projects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  return {
    projects: projects.map(p => ({
      name: p.name,
      client: p.client.name,
      status: getStatusLabel(p.status),
      startDate: p.startDate,
      dueDate: p.dueDate,
      updates: p._count.updates,
      files: p._count.files,
      approvals: p._count.approvals,
      messages: p._count.messages,
    })),
    byStatus,
    totals: {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
    },
  }
}

async function generateClientsReport(workspaceId: string, dateFilter: any) {
  const clients = await prisma.client.findMany({
    where: {
      workspaceId,
      ...(dateFilter.gte && { createdAt: dateFilter }),
    },
    include: {
      projects: { select: { status: true } },
      invoices: { select: { total: true, status: true } },
      contacts: { include: { user: { select: { email: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    clients: clients.map(c => ({
      name: c.name,
      primaryContact: c.contacts.find(ct => ct.isPrimary)?.user.email || '-',
      totalProjects: c.projects.length,
      activeProjects: c.projects.filter(p => p.status === 'active').length,
      totalRevenue: c.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      outstanding: c.invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0),
      createdAt: c.createdAt,
    })),
    totals: {
      totalClients: clients.length,
      totalProjects: clients.reduce((sum, c) => sum + c.projects.length, 0),
      totalRevenue: clients.reduce((sum, c) =>
        sum + c.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0), 0
      ),
    },
  }
}
