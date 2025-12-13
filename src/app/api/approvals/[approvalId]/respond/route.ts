import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendApprovalResponseNotification } from '@/lib/emails'

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

    // Find the approval and verify the user is a client contact
    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        requestedBy: true,
        project: {
          include: {
            client: {
              include: {
                contacts: true,
                workspace: true,
              },
            },
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

    // Verify user is a client contact for this project
    const isClientContact = approval.project.client.contacts.some(
      (contact) => contact.userId === session.user.id
    )

    if (!isClientContact) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get the responding user's info
    const respondingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    // Update the approval
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: validatedData.status,
        responseNote: validatedData.responseNote,
        respondedById: session.user.id,
        respondedAt: new Date(),
      },
    })

    // Notify the agency user who requested the approval
    if (approval.requestedBy.email) {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${approval.projectId}`

      await sendApprovalResponseNotification({
        agencyEmail: approval.requestedBy.email,
        agencyName: approval.requestedBy.name || '',
        clientName: respondingUser?.name || respondingUser?.email || 'Client',
        projectName: approval.project.name,
        approvalTitle: approval.title,
        status: validatedData.status,
        responseNote: validatedData.responseNote,
        dashboardUrl,
      })
    }

    return NextResponse.json(updatedApproval)
  } catch (error) {
    console.error('Error responding to approval:', error)

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
