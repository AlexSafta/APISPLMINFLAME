import { NextResponse } from 'next/server'
import { getSyncJobs } from '@/lib/services/providers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId') ?? undefined
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const jobs = await getSyncJobs(providerId, limit)
    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sync jobs' }, { status: 500 })
  }
}
