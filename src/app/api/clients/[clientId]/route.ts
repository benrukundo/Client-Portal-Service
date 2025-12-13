import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logActivity } from '@/lib/activity'

const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
      include: {
        contacts: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        projects: {
          select: { id: true, name: true, status: true },
        },
        _count: {
          select: { projects: true, invoices: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateClientSchema.parse(body)

    // Verify user has access to this client
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    })

    if (!existingClient) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 })
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        notes: data.notes,
      },
      include: {
        contacts: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    })

    // Log activity
    await logActivity({
      workspaceId: existingClient.workspaceId,
      userId: session.user.id,
      action: 'client.updated',
      description: `Updated client "${client.name}"`,
      clientId: client.id,
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating client:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access and is owner/admin
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ['owner', 'admin'] },
            },
          },
        },
      },
      include: {
        _count: {
          select: { projects: true, invoices: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client not found or access denied' }, { status: 404 })
    }

    const clientName = client.name
    const workspaceId = client.workspaceId

    // Delete client (this will cascade to projects, contacts, invoices, etc.)
    await prisma.client.delete({
      where: { id: clientId },
    })

    // Log activity
    await logActivity({
      workspaceId,
      userId: session.user.id,
      action: 'client.deleted',
      description: `Deleted client "${clientName}"`,
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
