import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  brandColor: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is owner or admin of this workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId,
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateWorkspaceSchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.brandColor && { brandColor: validatedData.brandColor }),
        ...(validatedData.website !== undefined && { website: validatedData.website || null }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)

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
