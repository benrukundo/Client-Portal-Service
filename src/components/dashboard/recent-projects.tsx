import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusColor, getStatusLabel } from '@/lib/constants'
import { MessageSquare, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  status: string
  client: {
    name: string
  }
  _count: {
    updates: number
    files: number
    approvals: number
    messages: number
  }
}

type RecentProjectsProps = {
  projects: Project[]
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No projects yet
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{project.name}</p>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.client.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1" title="Updates">
                      <MessageSquare className="h-4 w-4" />
                      {project._count.updates}
                    </span>
                    <span className="flex items-center gap-1" title="Files">
                      <FileText className="h-4 w-4" />
                      {project._count.files}
                    </span>
                    <span className="flex items-center gap-1" title="Approvals">
                      <CheckCircle className="h-4 w-4" />
                      {project._count.approvals}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
