import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID required' }, { status: 400 })
    }

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          workspace: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      },
      include: {
        client: true,
      },
    })

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    // Generate unique file key
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `${project.client.workspaceId}/${projectId}/${timestamp}-${sanitizedName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type)

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        key,
        url,
        size: file.size,
        type: file.type,
        projectId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(fileRecord)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

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

    // Verify access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          workspace: {
            members: {
              some: { userId: session.user.id },
            },
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
