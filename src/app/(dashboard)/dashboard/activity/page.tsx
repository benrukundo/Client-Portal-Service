import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Recent activity across your workspace</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed limit={50} />
        </CardContent>
      </Card>
    </div>
  )
}
