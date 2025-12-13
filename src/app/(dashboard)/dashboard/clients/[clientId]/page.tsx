import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/constants'
import { ArrowLeft, Plus, Mail, Calendar, FolderKanban, FileText, Users } from 'lucide-react'
import { DeleteClientButton } from '@/components/dashboard/delete-client-button'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
    include: {
      contacts: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { isPrimary: 'desc' },
      },
      projects: {
        include: {
          _count: { select: { updates: true, files: true, approvals: true, messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { projects: true, invoices: true },
      },
    },
  })

  if (!client) {
    notFound()
  }

  const totalRevenue = client.invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const outstandingAmount = client.invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.notes && (
              <p className="text-muted-foreground mt-1">{client.notes}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Added {formatDate(client.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <FolderKanban className="h-4 w-4" />
                {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {client._count.invoices} invoice{client._count.invoices !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                Edit Client
              </Link>
            </Button>
            <DeleteClientButton
              clientId={client.id}
              clientName={client.name}
              projectCount={client._count.projects}
              invoiceCount={client._count.invoices}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{client._count.projects}</div>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {client.projects.filter(p => p.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ${(totalRevenue / 100).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              ${(outstandingAmount / 100).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({client.projects.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({client.invoices.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({client.contacts.length})</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/dashboard/clients/${client.id}/projects/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
          {client.projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
                <p className="text-sm">Create your first project for this client</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{project.name}</h3>
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusLabel(project.status)}
                            </Badge>
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {project._count.updates} updates • {project._count.files} files
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
          {client.invoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices yet</p>
                <p className="text-sm">Create your first invoice for this client</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.invoices.map((invoice) => (
                <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Invoice #{invoice.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            ${(invoice.total / 100).toLocaleString()}
                          </span>
                          <Badge
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {client.contacts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contacts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(contact.user.name || contact.user.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {contact.user.name || 'No name'}
                            {contact.isPrimary && (
                              <Badge variant="outline" className="ml-2">Primary</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
