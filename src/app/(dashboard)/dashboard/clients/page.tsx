import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, FolderOpen } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
  })

  if (!workspaceMember) {
    return null
  }

  const clients = await prisma.client.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
    include: {
      contacts: {
        include: { user: true },
        where: { isPrimary: true },
        take: 1,
      },
      projects: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client accounts and their projects
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first client to start managing projects and sending invoices.
            </p>
            <Link href="/dashboard/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const primaryContact = client.contacts[0]?.user
            const activeProjects = client.projects.filter(p => p.status === 'active').length
            const totalProjects = client.projects.length

            return (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                      <CardDescription className="truncate">
                        {primaryContact?.email || 'No contact added'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        <span>{activeProjects} active / {totalProjects} total</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Added {formatDate(client.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
