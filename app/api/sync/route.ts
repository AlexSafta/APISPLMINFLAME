import { NextResponse } from 'next/server'
import { SyncRunSchema } from '@/lib/schemas'
import { runSync } from '@/lib/sync-runner'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { providerKey, full } = SyncRunSchema.parse(body)

    // Run async — return job ID immediately
    const jobId = await runSync(providerKey, full)
    return NextResponse.json({ jobId, message: 'Sync completed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
