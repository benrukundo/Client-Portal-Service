'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatusColor, getStatusLabel, PROJECT_STATUSES } from '@/lib/constants'

type ProjectsOverviewProps = {
  data: {
    status: string
    count: number
  }[]
  total: number
}

export function ProjectsOverview({ data, total }: ProjectsOverviewProps) {
  // Create a map for easy lookup
  const statusCounts = new Map(data.map(d => [d.status, d.count]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PROJECT_STATUSES.map((status) => {
            const count = statusCounts.get(status.value) || 0
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <div key={status.value} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{status.label}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      status.value === 'active' ? 'bg-blue-500' :
                      status.value === 'completed' ? 'bg-green-500' :
                      status.value === 'on-hold' ? 'bg-yellow-500' :
                      status.value === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
