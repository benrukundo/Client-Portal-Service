import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form'

export default async function ProfileSettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return null
  }

  return (
    <ProfileSettingsForm
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }}
    />
  )
}
