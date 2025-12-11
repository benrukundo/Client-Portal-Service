import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    const { approvalId } = await params
    
    console.log('=== Approval API Debug ===')
    console.log('Approval ID from URL:', approvalId)
    
    const session = await auth()
    console.log('Session user ID:', session?.user?.id)

    if (!session?.user?.id) {
      console.log('No session - unauthorized')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        requestedBy: {
          select: { name: true, email: true },
        },
        files: true,
        project: {
          include: {
            client: {
              include: {
                contacts: true,
              },
            },
          },
        },
      },
    })

    console.log('Approval found:', approval ? 'Yes' : 'No')
    
    if (approval) {
      console.log('Approval project ID:', approval.projectId)
      console.log('Approval client ID:', approval.project.clientId)
      console.log('Client contacts:', approval.project.client.contacts.map(c => c.userId))
    }

    if (!approval) {
      return NextResponse.json(
        { message: 'Approval not found' },
        { status: 404 }
      )
    }

    // Check if user is a workspace member (agency)
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: approval.project.client.workspaceId,
      },
    })
    console.log('Is workspace member:', workspaceMember ? 'Yes' : 'No')

    // Check if user is a client contact
    const clientContact = await prisma.clientContact.findFirst({
      where: {
        userId: session.user.id,
        clientId: approval.project.clientId,
      },
    })
    console.log('Is client contact:', clientContact ? 'Yes' : 'No')

    // User must be either workspace member or client contact
    if (!workspaceMember && !clientContact) {
      console.log('User is neither workspace member nor client contact - forbidden')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    console.log('Returning approval data')
    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
