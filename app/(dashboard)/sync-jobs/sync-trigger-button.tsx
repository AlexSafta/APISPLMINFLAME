'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { RefreshCw } from 'lucide-react'

interface Props {
  providers: { key: string; name: string }[]
}

export function SyncTriggerButton({ providers }: Props) {
  const router = useRouter()
  const [selectedKey, setSelectedKey] = useState(providers[0]?.key ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSync() {
    if (!selectedKey) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerKey: selectedKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Sync complete! Job ID: ${data.jobId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  if (providers.length === 0) return null

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-48"
        >
          {providers.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </Select>
        <Button onClick={handleSync} loading={loading} size="sm">
          <RefreshCw className="h-4 w-4" />
          Run Sync
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
    </div>
  )
}
