import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WorkspaceSettingsForm } from '@/components/dashboard/workspace-settings-form'

export default async function WorkspaceSettingsPage() {
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
    include: { workspace: true },
  })

  if (!workspaceMember) {
    return null
  }

  return (
    <WorkspaceSettingsForm
      workspace={{
        id: workspaceMember.workspace.id,
        name: workspaceMember.workspace.name,
        slug: workspaceMember.workspace.slug,
        logo: workspaceMember.workspace.logo,
        brandColor: workspaceMember.workspace.brandColor,
        website: workspaceMember.workspace.website,
        address: workspaceMember.workspace.address,
        phone: workspaceMember.workspace.phone,
      }}
    />
  )
}
