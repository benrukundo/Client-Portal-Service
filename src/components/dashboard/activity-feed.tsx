'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import {
  UserPlus,
  FolderPlus,
  FileUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  RefreshCw,
  FileText,
  Send,
  DollarSign,
  Users,
  UserMinus
} from 'lucide-react'

type Activity = {
  id: string
  action: string
  description: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  project: {
    id: string
    name: string
  } | null
  client: {
    id: string
    name: string
  } | null
}

type ActivityFeedProps = {
  projectId?: string
  workspaceId?: string
  limit?: number
}

function getActivityIcon(action: string) {
  const iconClass = "h-4 w-4"

  switch (action) {
    case 'client.created':
      return <UserPlus className={`${iconClass} text-green-600`} />
    case 'client.updated':
      return <Edit className={`${iconClass} text-blue-600`} />
    case 'client.deleted':
      return <Trash2 className={`${iconClass} text-red-600`} />
    case 'project.created':
      return <FolderPlus className={`${iconClass} text-green-600`} />
    case 'project.updated':
      return <Edit className={`${iconClass} text-blue-600`} />
    case 'project.status_changed':
      return <RefreshCw className={`${iconClass} text-purple-600`} />
    case 'project.deleted':
      return <Trash2 className={`${iconClass} text-red-600`} />
    case 'update.posted':
      return <MessageSquare className={`${iconClass} text-blue-600`} />
    case 'file.uploaded':
      return <FileUp className={`${iconClass} text-indigo-600`} />
    case 'file.deleted':
      return <Trash2 className={`${iconClass} text-red-600`} />
    case 'approval.requested':
      return <Clock className={`${iconClass} text-yellow-600`} />
    case 'approval.approved':
      return <CheckCircle className={`${iconClass} text-green-600`} />
    case 'approval.rejected':
      return <XCircle className={`${iconClass} text-red-600`} />
    case 'approval.changes_requested':
      return <RefreshCw className={`${iconClass} text-orange-600`} />
    case 'message.sent':
      return <MessageSquare className={`${iconClass} text-blue-600`} />
    case 'invoice.created':
      return <FileText className={`${iconClass} text-green-600`} />
    case 'invoice.sent':
      return <Send className={`${iconClass} text-blue-600`} />
    case 'invoice.paid':
      return <DollarSign className={`${iconClass} text-green-600`} />
    case 'member.invited':
      return <Users className={`${iconClass} text-green-600`} />
    case 'member.removed':
      return <UserMinus className={`${iconClass} text-red-600`} />
    default:
      return <Clock className={`${iconClass} text-gray-600`} />
  }
}

function getActivityVerb(action: string): string {
  switch (action) {
    case 'client.created':
      return 'created client'
    case 'client.updated':
      return 'updated client'
    case 'client.deleted':
      return 'deleted client'
    case 'project.created':
      return 'created project'
    case 'project.updated':
      return 'updated project'
    case 'project.status_changed':
      return 'changed project status'
    case 'project.deleted':
      return 'deleted project'
    case 'update.posted':
      return 'posted an update on'
    case 'file.uploaded':
      return 'uploaded a file to'
    case 'file.deleted':
      return 'deleted a file from'
    case 'approval.requested':
      return 'requested approval on'
    case 'approval.approved':
      return 'approved'
    case 'approval.rejected':
      return 'rejected'
    case 'approval.changes_requested':
      return 'requested changes on'
    case 'message.sent':
      return 'sent a message on'
    case 'invoice.created':
      return 'created invoice for'
    case 'invoice.sent':
      return 'sent invoice to'
    case 'invoice.paid':
      return 'received payment for'
    case 'member.invited':
      return 'invited'
    case 'member.removed':
      return 'removed'
    default:
      return 'performed action on'
  }
}

export function ActivityFeed({ projectId, workspaceId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const params = new URLSearchParams()
        if (projectId) params.set('projectId', projectId)
        if (workspaceId) params.set('workspaceId', workspaceId)
        params.set('limit', limit.toString())

        const response = await fetch(`/api/activity?${params}`)
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [projectId, workspaceId, limit])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
        <p className="text-sm">Actions will appear here as they happen</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const userName = activity.user.name || activity.user.email.split('@')[0]
        const verb = getActivityVerb(activity.action)

        return (
          <div
            key={activity.id}
            className={`flex gap-3 py-3 ${index !== activities.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getActivityIcon(activity.action)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{userName}</span>
                {' '}
                <span className="text-gray-600">{verb}</span>
                {' '}
                {activity.project ? (
                  <Link
                    href={`/dashboard/projects/${activity.project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {activity.project.name}
                  </Link>
                ) : activity.client ? (
                  <Link
                    href={`/dashboard/clients/${activity.client.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {activity.client.name}
                  </Link>
                ) : null}
              </p>
              {activity.description && !activity.description.includes(activity.project?.name || '') && !activity.description.includes(activity.client?.name || '') && (
                <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
