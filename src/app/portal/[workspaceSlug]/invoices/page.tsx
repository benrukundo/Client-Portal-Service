import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PortalInvoicesPageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function PortalInvoicesPage({ params }: PortalInvoicesPageProps) {
  const { workspaceSlug } = await params
  const session = await auth()

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    redirect('/')
  }

  if (!session?.user?.id) {
    redirect(`/portal/${workspaceSlug}/login`)
  }

  const clientContact = await prisma.clientContact.findFirst({
    where: {
      userId: session.user.id,
      client: { workspaceId: workspace.id },
    },
    include: {
      client: {
        include: {
          invoices: {
            where: { status: { not: 'draft' } },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  if (!clientContact) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have access to this portal.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const invoices = clientContact.client.invoices

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'sent':
        return 'bg-blue-100 text-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/portal/${workspaceSlug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">View and pay your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground text-center">
              Your invoices will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/portal/${workspaceSlug}/invoices/${invoice.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{invoice.number}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
