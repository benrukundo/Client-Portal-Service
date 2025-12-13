import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendApprovalRequestNotification } from '@/lib/emails'

const createApprovalSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})

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
    const validatedData = createApprovalSchema.parse(body)

    // Get project with client information for notifications and verification
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        client: {
          include: {
            workspace: true,
            contacts: {
              include: { user: true },
            },
          },
        },
      },
    })

    if (!project || project.client.workspaceId !== workspaceMember.workspaceId) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        projectId: validatedData.projectId,
        requestedById: session.user.id,
        status: 'pending',
      },
      include: {
        requestedBy: true,
      },
    })

    // Send email notifications to all client contacts
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${project.client.workspace.slug}/projects/${validatedData.projectId}/approvals/${approval.id}`

    for (const contact of project.client.contacts) {
      if (contact.user.email) {
        await sendApprovalRequestNotification({
          clientEmail: contact.user.email,
          clientName: contact.user.name || '',
          projectName: project.name,
          approvalTitle: validatedData.title,
          approvalDescription: validatedData.description,
          portalUrl,
          workspaceName: project.client.workspace.name,
        })
      }
    }

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)

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
