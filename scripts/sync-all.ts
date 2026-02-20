#!/usr/bin/env tsx
/**
 * npm run sync:all
 * Runs sync for all enabled providers that have a registered adapter
 */

import { runSyncAll } from '../lib/sync-runner'

console.log('[sync:all] Starting sync for all enabled providers...')

runSyncAll()
  .then((jobIds) => {
    console.log(`[sync:all] Done. Jobs: ${jobIds.join(', ') || 'none'}`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[sync:all] Fatal error:', err.message)
    process.exit(1)
  })
