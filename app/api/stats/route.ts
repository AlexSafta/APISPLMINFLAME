import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [totalProducts, totalProviders, inStockCount, outOfStockCount, brandsCount, categoriesCount] =
      await Promise.all([
        prisma.product.count(),
        prisma.provider.count({ where: { enabled: true } }),
        prisma.product.count({ where: { inStock: true } }),
        prisma.product.count({ where: { inStock: false } }),
        prisma.brand.count(),
        prisma.category.count(),
      ])

    return NextResponse.json({
      totalProducts,
      totalProviders,
      inStockCount,
      outOfStockCount,
      brandsCount,
      categoriesCount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
