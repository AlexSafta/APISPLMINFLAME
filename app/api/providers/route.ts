import { NextResponse } from 'next/server'
import { getProviders } from '@/lib/services/providers'

export async function GET() {
  try {
    const providers = await getProviders()
    return NextResponse.json({ providers })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}
