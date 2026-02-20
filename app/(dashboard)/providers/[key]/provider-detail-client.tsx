'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Play, ToggleLeft, ToggleRight } from 'lucide-react'

interface Provider {
  id: string
  key: string
  name: string
  enabled: boolean
  description: string | null
  _count: { products: number; brands: number; categories: number; syncJobs: number }
}

export function ProviderDetailClient({ provider: initial }: { provider: Provider }) {
  const router = useRouter()
  const [provider, setProvider] = useState(initial)
  const [syncing, setSyncing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleEnabled() {
    setToggling(true)
    setError(null)
    try {
      const res = await fetch(`/api/providers/${provider.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !provider.enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProvider((p) => ({ ...p, enabled: data.provider.enabled }))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setToggling(false)
    }
  }

  async function runSync() {
    if (!provider.enabled) {
      setError('Enable the provider first before running sync.')
      return
    }
    setSyncing(true)
    setError(null)
    setLastResult(null)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerKey: provider.key }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLastResult(`Sync complete. Job ID: ${data.jobId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            <Badge variant={provider.enabled ? 'success' : 'secondary'}>
              {provider.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-1">key: {provider.key}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEnabled}
            loading={toggling}
          >
            {provider.enabled ? (
              <><ToggleRight className="h-4 w-4" />Disable</>
            ) : (
              <><ToggleLeft className="h-4 w-4" />Enable</>
            )}
          </Button>
          <Button
            size="sm"
            onClick={runSync}
            loading={syncing}
            disabled={!provider.enabled}
          >
            <Play className="h-4 w-4" />
            Run Sync
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastResult && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {lastResult}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Products', value: provider._count.products },
          { label: 'Brands', value: provider._count.brands },
          { label: 'Categories', value: provider._count.categories },
          { label: 'Sync Jobs', value: provider._count.syncJobs },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {provider.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p>{provider.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Provider Key</p>
            <code className="bg-muted px-2 py-1 rounded text-xs">{provider.key}</code>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              How to implement the adapter
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-sm">
              <li>Copy <code className="bg-muted px-1 rounded">lib/providers/dummy.adapter.ts</code> to <code className="bg-muted px-1 rounded">lib/providers/{provider.key}.adapter.ts</code></li>
              <li>Implement <code className="bg-muted px-1 rounded">testConnection()</code>, <code className="bg-muted px-1 rounded">fetchBrands()</code>, <code className="bg-muted px-1 rounded">fetchCategories()</code>, <code className="bg-muted px-1 rounded">fetchProducts()</code></li>
              <li>Register in <code className="bg-muted px-1 rounded">lib/providers/registry.ts</code></li>
              <li>Enable this provider and run sync</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
