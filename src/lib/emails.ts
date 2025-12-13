import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'

type SendEmailParams = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: wrapInTemplate(html),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

function wrapInTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Sent via Portivo • <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #6366f1;">Client Portal</a>
        </p>
      </body>
    </html>
  `
}

export async function sendProjectUpdateNotification({
  clientEmail,
  clientName,
  projectName,
  updateContent,
  portalUrl,
  workspaceName,
}: {
  clientEmail: string
  clientName: string
  projectName: string
  updateContent: string
  portalUrl: string
  workspaceName: string
}) {
  const subject = `New update on ${projectName}`
  const html = `
    <h2 style="color: #111; margin-bottom: 20px;">New Project Update</h2>
    <p>Hi ${clientName || 'there'},</p>
    <p><strong>${workspaceName}</strong> posted an update on <strong>${projectName}</strong>:</p>
    <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
      ${updateContent}
    </div>
    <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
      View in Portal
    </a>
  `
  return sendEmail({ to: clientEmail, subject, html })
}

export async function sendApprovalRequestNotification({
  clientEmail,
  clientName,
  projectName,
  approvalTitle,
  approvalDescription,
  portalUrl,
  workspaceName,
}: {
  clientEmail: string
  clientName: string
  projectName: string
  approvalTitle: string
  approvalDescription?: string
  portalUrl: string
  workspaceName: string
}) {
  const subject = `Approval needed: ${approvalTitle}`
  const html = `
    <h2 style="color: #111; margin-bottom: 20px;">Approval Request</h2>
    <p>Hi ${clientName || 'there'},</p>
    <p><strong>${workspaceName}</strong> is requesting your approval on <strong>${projectName}</strong>:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0;">${approvalTitle}</h3>
      ${approvalDescription ? `<p style="color: #666; margin: 0;">${approvalDescription}</p>` : ''}
    </div>
    <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
      Review & Respond
    </a>
    <p style="color: #666; font-size: 14px;">Please review and provide your feedback.</p>
  `
  return sendEmail({ to: clientEmail, subject, html })
}

export async function sendNewMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  projectName,
  messagePreview,
  portalUrl,
}: {
  recipientEmail: string
  recipientName: string
  senderName: string
  projectName: string
  messagePreview: string
  portalUrl: string
}) {
  const subject = `New message on ${projectName}`
  const html = `
    <h2 style="color: #111; margin-bottom: 20px;">New Message</h2>
    <p>Hi ${recipientName || 'there'},</p>
    <p><strong>${senderName}</strong> sent a message on <strong>${projectName}</strong>:</p>
    <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
      ${messagePreview}
    </div>
    <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
      View Conversation
    </a>
  `
  return sendEmail({ to: recipientEmail, subject, html })
}

export async function sendInvoiceNotification({
  clientEmail,
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  portalUrl,
  workspaceName,
}: {
  clientEmail: string
  clientName: string
  invoiceNumber: string
  amount: string
  dueDate?: string
  portalUrl: string
  workspaceName: string
}) {
  const subject = `Invoice ${invoiceNumber} from ${workspaceName}`
  const html = `
    <h2 style="color: #111; margin-bottom: 20px;">New Invoice</h2>
    <p>Hi ${clientName || 'there'},</p>
    <p><strong>${workspaceName}</strong> has sent you an invoice:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${amount}</p>
      ${dueDate ? `<p style="margin: 0;"><strong>Due:</strong> ${dueDate}</p>` : ''}
    </div>
    <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
      View Invoice
    </a>
  `
  return sendEmail({ to: clientEmail, subject, html })
}

export async function sendApprovalResponseNotification({
  agencyEmail,
  agencyName,
  clientName,
  projectName,
  approvalTitle,
  status,
  responseNote,
  dashboardUrl,
}: {
  agencyEmail: string
  agencyName: string
  clientName: string
  projectName: string
  approvalTitle: string
  status: 'approved' | 'changes-requested' | 'rejected'
  responseNote?: string
  dashboardUrl: string
}) {
  const statusText = {
    approved: '✅ Approved',
    'changes-requested': '🔄 Changes Requested',
    rejected: '❌ Rejected',
  }[status]

  const statusColor = {
    approved: '#10b981',
    'changes-requested': '#f59e0b',
    rejected: '#ef4444',
  }[status]

  const subject = `${statusText}: ${approvalTitle}`
  const html = `
    <h2 style="color: #111; margin-bottom: 20px;">Approval Response</h2>
    <p>Hi ${agencyName || 'there'},</p>
    <p><strong>${clientName}</strong> has responded to your approval request on <strong>${projectName}</strong>:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0;">${approvalTitle}</h3>
      <p style="color: ${statusColor}; font-weight: bold; margin: 0 0 10px 0;">${statusText}</p>
      ${responseNote ? `<p style="color: #666; margin: 0;"><strong>Note:</strong> ${responseNote}</p>` : ''}
    </div>
    <a href="${dashboardUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
      View in Dashboard
    </a>
  `
  return sendEmail({ to: agencyEmail, subject, html })
}
