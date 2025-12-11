import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    // Verify the project belongs to this workspace
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        client: { workspaceId: workspaceMember.workspaceId },
      },
    })

    if (!project) {
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

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)

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
