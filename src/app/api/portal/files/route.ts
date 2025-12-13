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

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID required' }, { status: 400 })
    }

    // Verify user is a client contact for this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          contacts: {
            some: { userId: session.user.id },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    const files = await prisma.file.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
