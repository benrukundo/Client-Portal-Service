import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Plus, 
  Mail, 
  FolderOpen,
  Receipt,
  Users,
  MoreHorizontal
} from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { clientId } = await params
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
  })

  if (!workspaceMember) {
    notFound()
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      workspaceId: workspaceMember.workspaceId,
    },
    include: {
      contacts: {
        include: { user: true },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!client) {
    notFound()
  }

  const primaryContact = client.contacts.find(c => c.isPrimary)?.user

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'sent':
        return 'bg-blue-100 text-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {primaryContact && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {primaryContact.email}
                </p>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Client</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Client</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Projects ({client.projects.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices ({client.invoices.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts ({client.contacts.length})
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/dashboard/clients/${client.id}/projects/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {client.projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first project for this client.
                </p>
                <Link href={`/dashboard/clients/${client.id}/projects/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
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
            <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </div>

          {client.invoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first invoice for this client.
                </p>
                <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.invoices.map((invoice) => (
                <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <h3 className="font-medium">{invoice.number}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${(invoice.total / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                      <Badge className={getInvoiceStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-3">
            {client.contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(contact.user.name || contact.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {contact.user.name || 'No name'}
                        {contact.isPrimary && (
                          <Badge variant="outline" className="ml-2">Primary</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{contact.user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
