import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  notes: z.string().optional(),
})

export async function GET() {
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

    const clients = await prisma.client.findMany({
      where: { workspaceId: workspaceMember.workspaceId },
      include: {
        contacts: {
          include: { user: true },
        },
        projects: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
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
    const validatedData = createClientSchema.parse(body)

    // Create or find user for the contact
    let contactUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!contactUser) {
      contactUser = await prisma.user.create({
        data: {
          email: validatedData.email,
        },
      })
    }

    // Create client with contact in a transaction
    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          name: validatedData.name,
          notes: validatedData.notes,
          workspaceId: workspaceMember.workspaceId,
        },
      })

      await tx.clientContact.create({
        data: {
          clientId: newClient.id,
          userId: contactUser.id,
          isPrimary: true,
        },
      })

      return newClient
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)

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
