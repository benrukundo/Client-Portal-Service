'use client'

import { ActivityFeed } from '@/components/dashboard/activity-feed'

type ProjectActivityTabProps = {
  projectId: string
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  return <ActivityFeed projectId={projectId} limit={30} />
}
