import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendProjectUpdateNotification } from '@/lib/emails'

const createUpdateSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1),
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
    const validatedData = createUpdateSchema.parse(body)

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

    const update = await prisma.projectUpdate.create({
      data: {
        content: validatedData.content,
        projectId: validatedData.projectId,
        authorId: session.user.id,
      },
      include: {
        author: true,
      },
    })

    // Send email notifications to all client contacts
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${project.client.workspace.slug}/projects/${validatedData.projectId}`

    for (const contact of project.client.contacts) {
      if (contact.user.email) {
        await sendProjectUpdateNotification({
          clientEmail: contact.user.email,
          clientName: contact.user.name || '',
          projectName: project.name,
          updateContent: validatedData.content.substring(0, 500),
          portalUrl,
          workspaceName: project.client.workspace.name,
        })
      }
    }

    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    console.error('Error creating update:', error)

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
