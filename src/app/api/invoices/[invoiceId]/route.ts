import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logActivity } from '@/lib/activity'

const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateInvoiceSchema.parse(body)

    // Verify user has access to this invoice
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: { client: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    // Calculate new total if items are updated
    let total = existingInvoice.total
    let subtotal = existingInvoice.subtotal

    if (data.items) {
      subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      total = subtotal + existingInvoice.tax
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        subtotal: data.items ? subtotal : undefined,
        total: data.items ? total : undefined,
        paidAt: data.status === 'paid' ? new Date() : undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })

    // Update items if provided
    if (data.items) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId },
      })

      // Create new items
      await prisma.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      })
    }

    // Log activity
    if (data.status && data.status !== existingInvoice.status) {
      await logActivity({
        workspaceId: existingInvoice.client.workspaceId,
        userId: session.user.id,
        action: data.status === 'paid' ? 'invoice.paid' : 'invoice.updated' as any,
        description: data.status === 'paid'
          ? `Marked invoice as paid for "${existingInvoice.client.name}"`
          : `Updated invoice for "${existingInvoice.client.name}"`,
        clientId: existingInvoice.clientId,
      })
    }

    // Fetch updated invoice with items
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating invoice:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access and is owner/admin
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        },
      },
      include: { client: true },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 })
    }

    const clientName = invoice.client.name
    const workspaceId = invoice.client.workspaceId

    // Delete invoice (cascades to items)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    })

    // Log activity
    await logActivity({
      workspaceId,
      userId: session.user.id,
      action: 'invoice.deleted' as any,
      description: `Deleted invoice for "${clientName}"`,
      clientId: invoice.clientId,
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
