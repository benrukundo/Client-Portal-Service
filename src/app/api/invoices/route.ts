import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateInvoiceNumber } from '@/lib/utils'

const createInvoiceSchema = z.object({
  clientId: z.string(),
  dueDate: z.string().nullable().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { message: 'Workspace not found' },
        { status: 404 }
      )
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        client: { workspaceId: workspaceMember.workspaceId },
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { message: 'Workspace not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    // Verify client belongs to workspace
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    )
    const total = subtotal // No tax for now

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        clientId: validatedData.clientId,
        subtotal,
        total,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: 'draft',
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
