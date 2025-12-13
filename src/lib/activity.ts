import { prisma } from '@/lib/prisma'

export type ActivityAction =
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.status_changed'
  | 'project.deleted'
  | 'update.posted'
  | 'file.uploaded'
  | 'file.deleted'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'approval.changes_requested'
  | 'message.sent'
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'member.invited'
  | 'member.removed'

type LogActivityParams = {
  workspaceId: string
  userId: string
  action: ActivityAction
  description: string
  projectId?: string
  clientId?: string
  metadata?: Record<string, any>
}

export async function logActivity({
  workspaceId,
  userId,
  action,
  description,
  projectId,
  clientId,
  metadata,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        userId,
        action,
        entityType: action.split('.')[0], // Extract entity type from action (client, project, etc.)
        entityId: projectId || clientId || '', // Use projectId or clientId or empty string
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    })
  } catch (error) {
    // Log error but don't throw - activity logging shouldn't break main operations
    console.error('Failed to log activity:', error)
  }
}

export function getActivityIcon(action: ActivityAction): string {
  const icons: Record<string, string> = {
    'client.created': '👤',
    'client.updated': '✏️',
    'client.deleted': '🗑️',
    'project.created': '📁',
    'project.updated': '✏️',
    'project.status_changed': '🔄',
    'project.deleted': '🗑️',
    'update.posted': '📝',
    'file.uploaded': '📎',
    'file.deleted': '🗑️',
    'approval.requested': '🔔',
    'approval.approved': '✅',
    'approval.rejected': '❌',
    'approval.changes_requested': '🔄',
    'message.sent': '💬',
    'invoice.created': '📄',
    'invoice.sent': '📧',
    'invoice.paid': '💰',
    'member.invited': '👥',
    'member.removed': '👤',
  }
  return icons[action] || '📌'
}
