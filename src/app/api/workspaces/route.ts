import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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

    const body = await request.json()
    const validatedData = createWorkspaceSchema.parse(body)

    // Check if slug is already taken
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingWorkspace) {
      // Append random string to make slug unique
      validatedData.slug = `${validatedData.slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    // Check if user already has a workspace
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (existingMembership) {
      return NextResponse.json(
        { message: 'You already have a workspace' },
        { status: 400 }
      )
    }

    // Create workspace and membership in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          brandColor: validatedData.brandColor || '#0066FF',
          plan: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      })

      await tx.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: newWorkspace.id,
          role: 'owner',
        },
      })

      return newWorkspace
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)

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
