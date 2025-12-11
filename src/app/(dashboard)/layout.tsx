import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user's workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: true,
    },
  })

  // If user has no workspace, redirect to onboarding
  if (!workspaceMember) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar workspace={workspaceMember.workspace} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={session.user} workspace={workspaceMember.workspace} />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
