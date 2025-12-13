import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (projectId) {
      // Verify access to project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          client: {
            workspace: {
              members: { some: { userId: session.user.id } },
            },
          },
        },
      })

      if (!project) {
        return NextResponse.json({ message: 'Project not found' }, { status: 404 })
      }

      where.projectId = projectId
    } else if (workspaceId) {
      // Verify access to workspace
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id,
        },
      })

      if (!member) {
        return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
      }

      where.workspaceId = workspaceId
    } else {
      // Get user's workspace
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
      })

      if (!member) {
        return NextResponse.json({ message: 'No workspace found' }, { status: 404 })
      }

      where.workspaceId = member.workspaceId
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch project and client details separately if needed
    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        const result: any = { ...activity }

        // If entityType is 'project', fetch project details
        if (activity.entityType === 'project' && activity.entityId) {
          const project = await prisma.project.findUnique({
            where: { id: activity.entityId },
            select: { id: true, name: true },
          })
          result.project = project
        }

        // If entityType is 'client', fetch client details
        if (activity.entityType === 'client' && activity.entityId) {
          const client = await prisma.client.findUnique({
            where: { id: activity.entityId },
            select: { id: true, name: true },
          })
          result.client = client
        }

        return result
      })
    )

    return NextResponse.json(activitiesWithDetails)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
