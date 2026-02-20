import { getDashboardStats } from '@/lib/services/providers'
import { getSyncJobs } from '@/lib/services/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Server, CheckCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const [stats, jobs] = await Promise.all([
    getDashboardStats(),
    getSyncJobs(undefined, 5),
  ])

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600' },
    { label: 'Active Providers', value: stats.totalProviders, icon: Server, color: 'text-violet-600' },
    { label: 'In Stock', value: stats.inStockCount, icon: CheckCircle, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your product data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {stats.totalProducts === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No products yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Configure a provider and run a sync to import products.
            </p>
            <div className="flex gap-3">
              <Link href="/providers" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Server className="h-4 w-4" />
                Configure Providers
              </Link>
              <Link href="/sync-jobs" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                <RefreshCw className="h-4 w-4" />
                View Sync Jobs
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent syncs */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sync Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Provider</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Upserted</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{job.provider?.name ?? 'All'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-3">{job.upsertedCount}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(job.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'destructive' | 'warning' | 'secondary'; label: string }> = {
    SUCCESS: { variant: 'success', label: 'Success' },
    FAILED: { variant: 'destructive', label: 'Failed' },
    RUNNING: { variant: 'warning', label: 'Running' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    PARTIAL: { variant: 'warning', label: 'Partial' },
  }
  const { variant, label } = map[status] ?? { variant: 'secondary', label: status }
  return <Badge variant={variant}>{label}</Badge>
}
