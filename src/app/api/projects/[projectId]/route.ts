import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logActivity } from '@/lib/activity'

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
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
    })

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateProjectSchema.parse(body)

    // Verify user has access to this project
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: {
        client: true,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    // Check if status changed
    const statusChanged = data.status && data.status !== existingProject.status

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
    })

    // Log activity
    if (statusChanged) {
      await logActivity({
        workspaceId: existingProject.client.workspaceId,
        userId: session.user.id,
        action: 'project.status_changed',
        description: `Changed status of "${project.name}" from "${existingProject.status}" to "${data.status}"`,
        projectId: project.id,
        clientId: existingProject.clientId,
        metadata: { oldStatus: existingProject.status, newStatus: data.status },
      })
    } else if (data.name || data.description || data.startDate !== undefined || data.dueDate !== undefined) {
      await logActivity({
        workspaceId: existingProject.client.workspaceId,
        userId: session.user.id,
        action: 'project.updated',
        description: `Updated project "${project.name}"`,
        projectId: project.id,
        clientId: existingProject.clientId,
      })
    }

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating project:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access and is owner/admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
      include: {
        client: true,
      },
    })

    if (!project) {
      return NextResponse.json({ message: 'Project not found or access denied' }, { status: 404 })
    }

    const projectName = project.name
    const workspaceId = project.client.workspaceId
    const clientId = project.clientId

    // Delete project (cascades to related records)
    await prisma.project.delete({
      where: { id: projectId },
    })

    // Log activity
    await logActivity({
      workspaceId,
      userId: session.user.id,
      action: 'project.deleted',
      description: `Deleted project "${projectName}"`,
      clientId,
    })

    return NextResponse.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
