import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: {
        client: {
          include: {
            workspace: true,
            contacts: {
              where: { isPrimary: true },
              include: { user: { select: { email: true, name: true } } },
              take: 1,
            },
          },
        },
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any): string {
  const workspace = invoice.client.workspace
  const client = invoice.client
  const primaryContact = client.contacts[0]?.user

  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    sent: '#3b82f6',
    paid: '#10b981',
    overdue: '#ef4444',
    cancelled: '#6b7280',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${invoice.id.slice(-8).toUpperCase()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .invoice-number {
      font-size: 14px;
      color: #6b7280;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      background-color: ${statusColors[invoice.status] || '#6b7280'};
      margin-top: 8px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .party {
      flex: 1;
    }
    .party-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .party-details {
      font-size: 14px;
      color: #6b7280;
    }
    .dates {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .date-item {
      flex: 1;
    }
    .date-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .date-value {
      font-size: 14px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    th {
      text-align: left;
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 16px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    td:last-child {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #1f2937;
      margin-top: 8px;
      padding-top: 16px;
      font-size: 18px;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="logo">${workspace.name}</div>
      ${workspace.address ? `<div class="party-details">${workspace.address}</div>` : ''}
      ${workspace.phone ? `<div class="party-details">${workspace.phone}</div>` : ''}
      ${workspace.website ? `<div class="party-details">${workspace.website}</div>` : ''}
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-number">#${invoice.id.slice(-8).toUpperCase()}</div>
      <div class="status">${invoice.status}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-name">${client.name}</div>
      ${primaryContact ? `
        <div class="party-details">${primaryContact.name || ''}</div>
        <div class="party-details">${primaryContact.email}</div>
      ` : ''}
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <div class="date-label">Invoice Date</div>
      <div class="date-value">${formatDate(invoice.createdAt)}</div>
    </div>
    ${invoice.dueDate ? `
      <div class="date-item">
        <div class="date-label">Due Date</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>
    ` : ''}
    ${invoice.paidAt ? `
      <div class="date-item">
        <div class="date-label">Paid Date</div>
        <div class="date-value">${formatDate(invoice.paidAt)}</div>
      </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
          <td>${formatCurrency(item.total, invoice.currency)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
      </div>
      ${invoice.tax > 0 ? `
        <div class="totals-row">
          <span>Tax</span>
          <span>${formatCurrency(invoice.tax, invoice.currency)}</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total</span>
        <span>${formatCurrency(invoice.total, invoice.currency)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Generated by Portivo</p>
  </div>
</body>
</html>
  `
}
