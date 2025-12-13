import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  dueDate: string
  status: string
  client: {
    name: string
  }
}

type UpcomingDeadlinesProps = {
  projects: Project[]
  overdueCount: number
}

export function UpcomingDeadlines({ projects, overdueCount }: UpcomingDeadlinesProps) {
  const now = new Date()

  function getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate)
    const diff = due.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  function getUrgencyColor(days: number): string {
    if (days < 0) return 'text-red-600 bg-red-50'
    if (days <= 3) return 'text-orange-600 bg-orange-50'
    if (days <= 7) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
        {overdueCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} overdue
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming deadlines
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const daysUntil = getDaysUntilDue(project.dueDate)
              const urgencyClass = getUrgencyColor(daysUntil)

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.client.name}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${urgencyClass}`}>
                      {daysUntil < 0
                        ? `${Math.abs(daysUntil)} days overdue`
                        : daysUntil === 0
                        ? 'Due today'
                        : daysUntil === 1
                        ? 'Due tomorrow'
                        : `${daysUntil} days left`
                      }
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
