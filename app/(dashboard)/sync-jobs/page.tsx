import { getSyncJobs } from '@/lib/services/providers'
import { getProviders } from '@/lib/services/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SyncTriggerButton } from './sync-trigger-button'

export default async function SyncJobsPage() {
  const [jobs, providers] = await Promise.all([
    getSyncJobs(undefined, 50),
    getProviders(),
  ])

  const enabledProviders = providers.filter((p) => p.enabled)

  const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
    SUCCESS: 'success',
    FAILED: 'destructive',
    RUNNING: 'warning',
    PENDING: 'secondary',
    PARTIAL: 'warning',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sync Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            History of all provider sync operations
          </p>
        </div>
        <SyncTriggerButton providers={enabledProviders.map((p) => ({ key: p.key, name: p.name }))} />
      </div>

      {jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No sync jobs yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enable a provider and run a sync to see results here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fetched</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Upserted</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const duration =
                      job.startedAt && job.endedAt
                        ? Math.round((new Date(job.endedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
                        : null

                    return (
                      <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {job.provider?.name ?? <span className="text-muted-foreground">All</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[job.status] ?? 'secondary'}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{job.fetchedCount}</td>
                        <td className="px-4 py-3 text-right">{job.upsertedCount}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(job.startedAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {duration != null ? `${duration}s` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-destructive max-w-xs truncate">
                          {job.errorMessage ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
