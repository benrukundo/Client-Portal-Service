'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { FileText, Download, BarChart3, Users, FolderKanban, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type ReportType = 'summary' | 'revenue' | 'projects' | 'clients'

const reportTypes = [
  { value: 'summary', label: 'Summary Report', icon: BarChart3, description: 'Overview of all metrics' },
  { value: 'revenue', label: 'Revenue Report', icon: DollarSign, description: 'Detailed revenue and invoices' },
  { value: 'projects', label: 'Projects Report', icon: FolderKanban, description: 'All projects and their status' },
  { value: 'clients', label: 'Clients Report', icon: Users, description: 'Client list with metrics' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  async function generateReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: reportType })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) throw new Error('Failed to generate report')

      const data = await response.json()
      setReport(data)
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  function downloadReport() {
    if (!report) return

    const content = JSON.stringify(report, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.type}-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadCSV() {
    if (!report) return

    let csv = ''
    const data = report.data

    if (reportType === 'revenue' && data.invoices) {
      csv = 'Invoice Number,Client,Amount,Status,Created,Paid\n'
      data.invoices.forEach((inv: any) => {
        csv += `${inv.number},${inv.client},${inv.amount / 100},${inv.status},${formatDate(inv.createdAt)},${inv.paidAt ? formatDate(inv.paidAt) : '-'}\n`
      })
    } else if (reportType === 'projects' && data.projects) {
      csv = 'Project,Client,Status,Start Date,Due Date,Updates,Files\n'
      data.projects.forEach((p: any) => {
        csv += `${p.name},${p.client},${p.status},${p.startDate ? formatDate(p.startDate) : '-'},${p.dueDate ? formatDate(p.dueDate) : '-'},${p.updates},${p.files}\n`
      })
    } else if (reportType === 'clients' && data.clients) {
      csv = 'Client,Primary Contact,Projects,Active Projects,Revenue,Outstanding\n'
      data.clients.forEach((c: any) => {
        csv += `${c.name},${c.primaryContact},${c.totalProjects},${c.activeProjects},${c.totalRevenue / 100},${c.outstanding / 100}\n`
      })
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.type}-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and download business reports</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date (optional)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button onClick={generateReport} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                {report ? `${report.workspace} - Generated ${formatDate(report.generatedAt)}` : 'Generate a report to preview'}
              </CardDescription>
            </div>
            {report && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!report ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select options and generate a report</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Report */}
                {reportType === 'summary' && report.data && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Clients</p>
                        <p className="text-2xl font-bold">{report.data.overview?.totalClients || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Projects</p>
                        <p className="text-2xl font-bold">{report.data.overview?.totalProjects || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold">{report.data.overview?.activeProjects || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(report.data.financial?.totalRevenue || 0)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-2xl font-bold">{formatCurrency(report.data.financial?.outstanding || 0)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Paid Invoices</p>
                        <p className="text-2xl font-bold">{report.data.overview?.paidInvoices || 0}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Revenue Report */}
                {reportType === 'revenue' && report.data?.invoices && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Invoice</th>
                          <th className="text-left py-2">Client</th>
                          <th className="text-right py-2">Amount</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.data.invoices.slice(0, 10).map((inv: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="py-2">{inv.number}</td>
                            <td className="py-2">{inv.client}</td>
                            <td className="py-2 text-right">{formatCurrency(inv.amount)}</td>
                            <td className="py-2 capitalize">{inv.status}</td>
                            <td className="py-2">{formatDate(inv.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {report.data.invoices.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing 10 of {report.data.invoices.length} invoices. Download for full report.
                      </p>
                    )}
                  </div>
                )}

                {/* Projects Report */}
                {reportType === 'projects' && report.data?.projects && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Project</th>
                          <th className="text-left py-2">Client</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Due Date</th>
                          <th className="text-right py-2">Updates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.data.projects.slice(0, 10).map((p: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2">{p.client}</td>
                            <td className="py-2">{p.status}</td>
                            <td className="py-2">{p.dueDate ? formatDate(p.dueDate) : '-'}</td>
                            <td className="py-2 text-right">{p.updates}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clients Report */}
                {reportType === 'clients' && report.data?.clients && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Client</th>
                          <th className="text-left py-2">Contact</th>
                          <th className="text-right py-2">Projects</th>
                          <th className="text-right py-2">Revenue</th>
                          <th className="text-right py-2">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.data.clients.slice(0, 10).map((c: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="py-2">{c.name}</td>
                            <td className="py-2">{c.primaryContact}</td>
                            <td className="py-2 text-right">{c.totalProjects}</td>
                            <td className="py-2 text-right">{formatCurrency(c.totalRevenue)}</td>
                            <td className="py-2 text-right">{formatCurrency(c.outstanding)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((type) => (
          <Card
            key={type.value}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setReportType(type.value as ReportType)
              generateReport()
            }}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <type.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
