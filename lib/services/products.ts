import { prisma } from '@/lib/db'
import { cacheGet, cacheSet } from '@/lib/redis'
import { ProductsQuery } from '@/lib/schemas'
import { Prisma } from '@prisma/client'

export async function getProducts(query: ProductsQuery) {
  const {
    page, limit, q, provider, brand, category,
    inStock, minPrice, maxPrice, minStock, maxStock,
    hasImages, hasDescription, updatedWithin, sort,
  } = query

  const where: Prisma.ProductWhereInput = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (provider) where.provider = { key: provider }
  if (brand) where.brand = { slug: brand }
  if (category) where.category = { slug: category }
  if (inStock !== undefined) where.inStock = inStock
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }
  if (minStock !== undefined || maxStock !== undefined) {
    where.stockQty = {}
    if (minStock !== undefined) where.stockQty.gte = minStock
    if (maxStock !== undefined) where.stockQty.lte = maxStock
  }
  if (hasImages) where.images = { isEmpty: false }
  if (hasDescription) where.description = { not: null }
  if (updatedWithin) {
    const now = new Date()
    const map = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 }
    where.updatedAt = { gte: new Date(now.getTime() - map[updatedWithin]) }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (sort) {
      case 'price_asc': return { price: 'asc' }
      case 'price_desc': return { price: 'desc' }
      case 'stock_desc': return { stockQty: 'desc' }
      case 'name_asc': return { name: 'asc' }
      default: return { updatedAt: 'desc' }
    }
  })()

  const skip = (page - 1) * limit

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        provider: { select: { id: true, key: true, name: true } },
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { attributes: true } },
      },
    }),
  ])

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      provider: true,
      brand: true,
      category: true,
      attributes: { orderBy: { key: 'asc' } },
      priceHistory: { orderBy: { at: 'desc' }, take: 50 },
    },
  })
}

export async function getFilterOptions() {
  const cacheKey = 'filter-options'
  const cached = await cacheGet<ReturnType<typeof fetchFilterOptions>>(cacheKey)
  if (cached) return cached

  const result = await fetchFilterOptions()
  await cacheSet(cacheKey, result, 120)
  return result
}

async function fetchFilterOptions() {
  const [providers, brands, categories] = await Promise.all([
    prisma.provider.findMany({ select: { key: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' }, distinct: ['slug'] }),
    prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' }, distinct: ['slug'] }),
  ])
  return { providers, brands, categories }
}
