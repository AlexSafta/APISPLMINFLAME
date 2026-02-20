import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdapter } from '@/lib/providers/registry'
import { z } from 'zod'

const UpdateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
})

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { key: params.key },
      include: {
        credentials: { select: { id: true, key: true, updatedAt: true } },
        _count: { select: { products: true, brands: true, categories: true, syncJobs: true } },
      },
    })
    if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const hasAdapter = !!getAdapter(params.key)
    return NextResponse.json({ provider, hasAdapter })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  try {
    const body = await req.json()
    const data = UpdateProviderSchema.parse(body)
    const provider = await prisma.provider.update({
      where: { key: params.key },
      data,
    })
    return NextResponse.json({ provider })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
