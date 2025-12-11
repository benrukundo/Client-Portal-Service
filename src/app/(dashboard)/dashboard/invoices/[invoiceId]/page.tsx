import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, MoreHorizontal } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SendInvoiceButton } from '@/components/dashboard/send-invoice-button'

interface InvoicePageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId } = await params
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
    include: { workspace: true },
  })

  if (!workspaceMember) {
    notFound()
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      client: { workspaceId: workspaceMember.workspaceId },
    },
    include: {
      client: {
        include: {
          contacts: {
            include: { user: true },
            where: { isPrimary: true },
          },
        },
      },
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
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const primaryContact = invoice.client.contacts[0]?.user

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
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
          <p className="text-muted-foreground mt-1">
            {invoice.client.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <SendInvoiceButton invoiceId={invoice.id} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Download PDF</DropdownMenuItem>
              <DropdownMenuItem>Edit Invoice</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Cancel Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg">From</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {workspaceMember.workspace.name}
              </p>
            </div>
            <div className="text-right">
              <CardTitle className="text-lg">To</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {invoice.client.name}
              </p>
              {primaryContact && (
                <p className="text-sm text-muted-foreground">
                  {primaryContact.email}
                </p>
              )}
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

          {/* Payment Info */}
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
