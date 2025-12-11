import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PortalInvoicePageProps {
  params: Promise<{ workspaceSlug: string; invoiceId: string }>
}

export default async function PortalInvoicePage({ params }: PortalInvoicePageProps) {
  const { workspaceSlug, invoiceId } = await params
  const session = await auth()

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    notFound()
  }

  if (!session?.user?.id) {
    redirect(`/portal/${workspaceSlug}/login`)
  }

  const clientContact = await prisma.clientContact.findFirst({
    where: {
      userId: session.user.id,
      client: { workspaceId: workspace.id },
    },
  })

  if (!clientContact) {
    redirect(`/portal/${workspaceSlug}`)
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId: clientContact.clientId,
      status: { not: 'draft' },
    },
    include: {
      client: true,
      items: true,
    },
  })

  if (!invoice) {
    notFound()
  }

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/portal/${workspaceSlug}/invoices`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.number}</h1>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>
        </div>
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <Button size="lg">
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </Button>
        )}
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg">From</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {workspace.name}
              </p>
            </div>
            <div className="text-right">
              <CardTitle className="text-lg">To</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {invoice.client.name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.dueDate && (
              <div className="text-right">
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Description</th>
                  <th className="text-right p-3 text-sm font-medium">Qty</th>
                  <th className="text-right p-3 text-sm font-medium">Price</th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted">
                <tr className="border-t">
                  <td colSpan={3} className="p-3 text-right font-medium">
                    Subtotal
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </td>
                </tr>
                {invoice.tax > 0 && (
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-medium">
                      Tax
                    </td>
                    <td className="p-3 text-right font-medium">
                        {formatCurrency(invoice.tax, invoice.currency)}
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td colSpan={3} className="p-3 text-right text-lg font-bold">
                    Total
                  </td>
                  <td className="p-3 text-right text-lg font-bold">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Status */}
          {invoice.status === 'paid' && invoice.paidAt && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">
                ✓ Paid on {formatDate(invoice.paidAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
