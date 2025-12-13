'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { getActivityIcon } from '@/lib/activity'
import Link from 'next/link'

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
    return <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(activity.user.name || activity.user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="mr-2">{getActivityIcon(activity.action as any)}</span>
              <span className="font-medium">{activity.user.name || activity.user.email}</span>
              {' '}
              <span className="text-muted-foreground">{activity.description}</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{formatRelativeTime(activity.createdAt)}</span>
              {activity.project && (
                <>
                  <span>•</span>
                  <Link
                    href={`/dashboard/projects/${activity.project.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {activity.project.name}
                  </Link>
                </>
              )}
              {activity.client && !activity.project && (
                <>
                  <span>•</span>
                  <Link
                    href={`/dashboard/clients/${activity.client.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {activity.client.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
