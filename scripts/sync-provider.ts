#!/usr/bin/env tsx
/**
 * npm run sync:provider <providerKey>
 * Exemplu: npm run sync:provider emag
 */

import { runProviderSync } from '../lib/services/sync.service'

const key = process.argv[2]
if (!key) {
  console.error('Usage: npm run sync:provider <providerKey>')
  process.exit(1)
}

console.log(`[sync] Running sync for provider: ${key}`)

runProviderSync(key)
  .then((jobId) => {
    console.log(`[sync] Done. Job ID: ${jobId}`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[sync] Error:', err.message)
    process.exit(1)
  })
