import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    console.error('Error creating update:', error)

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
