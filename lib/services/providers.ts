import { prisma } from '@/lib/db'
import { cacheGet, cacheSet } from '@/lib/redis'

export async function getProviders() {
  const cached = await cacheGet<Awaited<ReturnType<typeof fetchProviders>>>('providers:all')
  if (cached) return cached
  const result = await fetchProviders()
  await cacheSet('providers:all', result, 60)
  return result
}

async function fetchProviders() {
  return prisma.provider.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: true, brands: true, categories: true } },
    },
  })
}

export async function getProviderByKey(key: string) {
  return prisma.provider.findUnique({
    where: { key },
    include: {
      credentials: { select: { id: true, key: true, updatedAt: true } },
      _count: { select: { products: true, brands: true, categories: true, syncJobs: true } },
    },
  })
}

export async function getDashboardStats() {
  const [totalProducts, totalProviders, inStockCount] = await Promise.all([
    prisma.product.count(),
    prisma.provider.count({ where: { enabled: true } }),
    prisma.product.count({ where: { inStock: true } }),
  ])
  return { totalProducts, totalProviders, inStockCount }
}

export async function getSyncJobs(providerId?: string, limit = 20) {
  return prisma.syncJob.findMany({
    where: providerId ? { providerId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      provider: { select: { key: true, name: true } },
    },
  })
}
