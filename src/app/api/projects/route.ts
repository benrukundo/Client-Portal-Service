import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logActivity } from '@/lib/activity'

const createProjectSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['active', 'on-hold', 'completed', 'cancelled']).default('active'),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
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

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { message: 'Workspace not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    const projects = await prisma.project.findMany({
      where: {
        client: { workspaceId: workspaceMember.workspaceId },
        ...(clientId && { clientId }),
        ...(status && { status }),
      },
      include: {
        client: true,
        _count: {
          select: {
            updates: true,
            files: true,
            approvals: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const validatedData = createProjectSchema.parse(body)

    // Verify the client belongs to this workspace
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

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        clientId: validatedData.clientId,
      },
    })

    // Log activity
    await logActivity({
      workspaceId: workspaceMember.workspaceId,
      userId: session.user.id,
      action: 'project.created',
      description: `Created project "${validatedData.name}"`,
      projectId: project.id,
      clientId: validatedData.clientId,
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)

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
