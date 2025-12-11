import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const respondSchema = z.object({
  status: z.enum(['approved', 'changes-requested', 'rejected']),
  responseNote: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    const { approvalId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = respondSchema.parse(body)

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { message: 'Approval not found' },
        { status: 404 }
      )
    }

    const clientContact = await prisma.clientContact.findFirst({
      where: {
        userId: session.user.id,
        clientId: approval.project.clientId,
      },
    })

    if (!clientContact) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: validatedData.status,
        responseNote: validatedData.responseNote,
        respondedById: session.user.id,
        respondedAt: new Date(),
      },
    })

    return NextResponse.json(updatedApproval)
  } catch (error) {
    console.error('Error responding to approval:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
