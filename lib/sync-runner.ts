/**
 * Sync Runner — wrapper peste sync.service, folosit din API routes și scripts
 */

import { runProviderSync } from '@/lib/services/sync.service'
import { listAdapterKeys } from '@/lib/providers/registry'
import { prisma } from '@/lib/db'

export async function runSync(providerKey: string, _full = false): Promise<string> {
  return runProviderSync(providerKey)
}

export async function runSyncAll(): Promise<string[]> {
  const keys = listAdapterKeys().filter((k) => k !== 'dummy')

  const enabledProviders = await prisma.provider.findMany({
    where: { enabled: true, key: { in: keys } },
    select: { key: true },
  })

  const jobIds: string[] = []
  for (const p of enabledProviders) {
    try {
      const jobId = await runProviderSync(p.key)
      jobIds.push(jobId)
    } catch (err) {
      console.error(`[sync:all] Failed for ${p.key}:`, err)
    }
  }
  return jobIds
}
