'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

type RevenueChartProps = {
  data: {
    month: string
    year: number
    revenue: number
  }[]
  currency?: string
}

export function RevenueChart({ data, currency = 'usd' }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {data.map((item, index) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-muted-foreground mb-1">
                      {item.revenue > 0 ? formatCurrency(item.revenue, currency) : '-'}
                    </span>
                    <div
                      className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
