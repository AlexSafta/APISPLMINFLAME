/**
 * Sync Service — orchestrates provider sync jobs
 * Handles upsert logic, delta sync, price history tracking
 */

import { prisma } from '@/lib/db'
import { getAdapter } from '@/lib/providers/registry'
import type { NormalizedProduct } from '@/lib/providers/adapter.interface'

type SyncLog = { ts: string; level: 'info' | 'warn' | 'error'; msg: string }

export async function runProviderSync(providerKey: string): Promise<string> {
  const provider = await prisma.provider.findUnique({ where: { key: providerKey } })
  if (!provider) throw new Error(`Provider "${providerKey}" not found in DB`)
  if (!provider.enabled) throw new Error(`Provider "${providerKey}" is disabled`)

  const adapter = getAdapter(providerKey)
  if (!adapter) throw new Error(`No adapter registered for key "${providerKey}"`)

  // Create sync job
  const job = await prisma.syncJob.create({
    data: {
      providerId: provider.id,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  const logs: SyncLog[] = []
  const log = (level: SyncLog['level'], msg: string) => {
    logs.push({ ts: new Date().toISOString(), level, msg })
    console.log(`[sync:${providerKey}] [${level.toUpperCase()}] ${msg}`)
  }

  let fetchedCount = 0
  let upsertedCount = 0
  let status: 'SUCCESS' | 'FAILED' | 'PARTIAL' = 'SUCCESS'
  let errorMessage: string | undefined

  try {
    log('info', 'Starting sync')

    // Find last successful sync for delta
    const lastSuccess = await prisma.syncJob.findFirst({
      where: { providerId: provider.id, status: 'SUCCESS' },
      orderBy: { endedAt: 'desc' },
    })
    const updatedSince = lastSuccess?.endedAt ?? undefined

    if (updatedSince) {
      log('info', `Delta sync: fetching products updated since ${updatedSince.toISOString()}`)
    } else {
      log('info', 'Full sync: no previous successful sync found')
    }

    // Sync brands
    log('info', 'Fetching brands...')
    const brands = await adapter.fetchBrands()
    log('info', `Fetched ${brands.length} brands`)
    for (const brand of brands) {
      const slug = slugify(brand.name)
      await prisma.brand.upsert({
        where: { providerId_externalId: { providerId: provider.id, externalId: brand.externalId } },
        update: { name: brand.name },
        create: {
          providerId: provider.id,
          externalId: brand.externalId,
          name: brand.name,
          slug,
        },
      })
    }

    // Sync categories
    log('info', 'Fetching categories...')
    const categories = await adapter.fetchCategories()
    log('info', `Fetched ${categories.length} categories`)
    for (const cat of categories) {
      const slug = slugify(cat.name)
      await prisma.category.upsert({
        where: { providerId_externalId: { providerId: provider.id, externalId: cat.externalId } },
        update: { name: cat.name },
        create: {
          providerId: provider.id,
          externalId: cat.externalId,
          name: cat.name,
          slug,
        },
      })
    }

    // Sync products (paginated)
    log('info', 'Fetching products...')
    let cursor: string | undefined = undefined
    let page = 0

    do {
      const result = await adapter.fetchProducts({ cursor, updatedSince, limit: 100 })
      fetchedCount += result.products.length
      page++

      for (const p of result.products) {
        await upsertProduct(provider.id, p)
        upsertedCount++
      }

      log('info', `Page ${page}: fetched ${result.products.length} products (total: ${fetchedCount})`)
      cursor = result.nextCursor
    } while (cursor)

    log('info', `Sync complete. Fetched: ${fetchedCount}, Upserted: ${upsertedCount}`)
  } catch (err) {
    status = 'FAILED'
    errorMessage = err instanceof Error ? err.message : String(err)
    log('error', `Sync failed: ${errorMessage}`)
  }

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status,
      endedAt: new Date(),
      fetchedCount,
      upsertedCount,
      errorMessage,
      logs,
    },
  })

  return job.id
}

async function upsertProduct(providerId: string, p: NormalizedProduct) {
  // Resolve brand and category by externalId
  const brand = p.brandExternalId
    ? await prisma.brand.findUnique({
        where: { providerId_externalId: { providerId, externalId: p.brandExternalId } },
      })
    : null

  const category = p.categoryExternalId
    ? await prisma.category.findUnique({
        where: { providerId_externalId: { providerId, externalId: p.categoryExternalId } },
      })
    : null

  const existing = await prisma.product.findUnique({
    where: { providerId_externalId: { providerId, externalId: p.externalId } },
    select: { id: true, price: true },
  })

  const productData = {
    sku: p.sku ?? null,
    name: p.name,
    description: p.description ?? null,
    price: p.price != null ? p.price : null,
    currency: p.currency ?? 'RON',
    stockQty: p.stockQty ?? null,
    inStock: p.inStock,
    url: p.url ?? null,
    images: p.images ?? [],
    rawJson: (p.rawJson ?? {}) as object,
    brandId: brand?.id ?? null,
    categoryId: category?.id ?? null,
    updatedAt: new Date(),
  }

  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data: productData })

    // Track price history if price changed
    const newPrice = p.price != null ? p.price : null
    const oldPrice = existing.price != null ? Number(existing.price) : null
    if (newPrice !== null && newPrice !== oldPrice) {
      await prisma.priceHistory.create({
        data: { productId: existing.id, price: newPrice, currency: p.currency ?? 'RON' },
      })
    }

    // Update attributes
    if (p.attributes) {
      await prisma.productAttribute.deleteMany({ where: { productId: existing.id } })
      await prisma.productAttribute.createMany({
        data: Object.entries(p.attributes).map(([key, value]) => ({
          productId: existing.id,
          key,
          value,
        })),
      })
    }
  } else {
    const created = await prisma.product.create({
      data: { ...productData, providerId, externalId: p.externalId },
    })
    if (p.price != null) {
      await prisma.priceHistory.create({
        data: { productId: created.id, price: p.price, currency: p.currency ?? 'RON' },
      })
    }
    if (p.attributes) {
      await prisma.productAttribute.createMany({
        data: Object.entries(p.attributes).map(([key, value]) => ({
          productId: created.id,
          key,
          value,
        })),
      })
    }
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}
