import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        provider: { select: { key: true, name: true } },
        _count: { select: { products: true } },
      },
    })
    return NextResponse.json({ brands })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
