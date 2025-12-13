import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const type = searchParams.get('type') || 'all' // all, clients, projects, files, invoices

    if (!query || query.length < 2) {
      return NextResponse.json({
        clients: [],
        projects: [],
        files: [],
        invoices: [],
        total: 0
      })
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!member) {
      return NextResponse.json({ message: 'No workspace found' }, { status: 404 })
    }

    const workspaceId = member.workspaceId
    const searchQuery = query.toLowerCase()

    const results: {
      clients: any[]
      projects: any[]
      files: any[]
      invoices: any[]
    } = {
      clients: [],
      projects: [],
      files: [],
      invoices: [],
    }

    // Search Clients
    if (type === 'all' || type === 'clients') {
      const clients = await prisma.client.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { notes: { contains: searchQuery, mode: 'insensitive' } },
            {
              contacts: {
                some: {
                  user: {
                    OR: [
                      { email: { contains: searchQuery, mode: 'insensitive' } },
                      { name: { contains: searchQuery, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          ],
        },
        include: {
          contacts: {
            where: { isPrimary: true },
            include: { user: { select: { email: true, name: true } } },
            take: 1,
          },
          _count: { select: { projects: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      })

      results.clients = clients.map((client) => ({
        id: client.id,
        type: 'client',
        title: client.name,
        subtitle: client.contacts[0]?.user.email || '',
        description: client.notes || '',
        meta: `${client._count.projects} project${client._count.projects !== 1 ? 's' : ''}`,
        url: `/dashboard/clients/${client.id}`,
      }))
    }

    // Search Projects
    if (type === 'all' || type === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          client: { workspaceId },
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        include: {
          client: { select: { name: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      })

      results.projects = projects.map((project) => ({
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: project.client.name,
        description: project.description || '',
        meta: project.status,
        url: `/dashboard/projects/${project.id}`,
      }))
    }

    // Search Files
    if (type === 'all' || type === 'files') {
      const files = await prisma.file.findMany({
        where: {
          project: { client: { workspaceId } },
          name: { contains: searchQuery, mode: 'insensitive' },
        },
        include: {
          project: {
            select: { name: true, id: true },
          },
          uploadedBy: { select: { name: true, email: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      results.files = files.map((file) => ({
        id: file.id,
        type: 'file',
        title: file.name,
        subtitle: file.project.name,
        description: `Uploaded by ${file.uploadedBy.name || file.uploadedBy.email}`,
        meta: formatFileSize(file.size),
        url: `/dashboard/projects/${file.project.id}?tab=files`,
        fileUrl: file.url,
      }))
    }

    // Search Invoices
    if (type === 'all' || type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: {
          client: { workspaceId },
          OR: [
            { number: { contains: searchQuery, mode: 'insensitive' } },
            { client: { name: { contains: searchQuery, mode: 'insensitive' } } },
          ],
        },
        include: {
          client: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      results.invoices = invoices.map((invoice) => ({
        id: invoice.id,
        type: 'invoice',
        title: invoice.number,
        subtitle: invoice.client.name,
        description: `${formatCurrency(invoice.total)}`,
        meta: invoice.status,
        url: `/dashboard/invoices/${invoice.id}`,
      }))
    }

    const total =
      results.clients.length +
      results.projects.length +
      results.files.length +
      results.invoices.length

    return NextResponse.json({ ...results, total })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)
}
