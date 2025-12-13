import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMessageSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1).max(5000),
})

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get the project and verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user is workspace member or client contact
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: project.client.workspaceId,
      },
    })

    const clientContact = await prisma.clientContact.findFirst({
      where: {
        userId: session.user.id,
        clientId: project.clientId,
      },
    })

    if (!workspaceMember && !clientContact) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const messages = await prisma.message.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
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

    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Get the project and verify access
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        client: {
          include: {
            contacts: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user is workspace member or client contact
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: project.client.workspaceId,
      },
    })

    const clientContact = await prisma.clientContact.findFirst({
      where: {
        userId: session.user.id,
        clientId: project.clientId,
      },
    })

    if (!workspaceMember && !clientContact) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        projectId: validatedData.projectId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)

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
