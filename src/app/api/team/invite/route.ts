import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
  workspaceId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role, workspaceId } = inviteSchema.parse(body)

    // Verify user is owner or admin of this workspace
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] },
      },
      include: { workspace: true },
    })

    if (!member) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Check if user already exists
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    })

    // Create user if doesn't exist
    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: { email },
      })
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: invitedUser.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { message: 'This user is already a team member' },
        { status: 400 }
      )
    }

    // Add as workspace member
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: invitedUser.id,
        role,
      },
    })

    // Send invitation email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: `You've been invited to ${member.workspace.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>You've been invited to join <strong>${member.workspace.name}</strong> on Portivo as a ${role}.</p>
          <p>Click the button below to sign in and access the workspace:</p>
          <a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Sign In to Portivo
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'Invitation sent successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    console.error('Error sending invite:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
