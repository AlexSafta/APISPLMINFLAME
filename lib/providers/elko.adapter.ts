/**
 * ELKO B2B API Adapter
 *
 * API: https://roapi.elko.cloud/v3.0/
 * Autentificare: Bearer JWT Token
 *
 * Endpoints principale:
 *   GET Catalogs/Products          — lista produse
 *   GET Catalogs/Products/{code}/Availability — preț + stoc
 *   GET Catalogs/Categories        — categorii
 *   GET Catalogs/Vendors           — producători
 */

import type {
  ProviderAdapter,
  ProviderTestResult,
  NormalizedBrand,
  NormalizedCategory,
  FetchProductsOptions,
  FetchProductsResult,
  NormalizedProduct,
} from './adapter.interface'

interface ElkoCredentials {
  baseUrl: string
  token: string
}

interface ElkoProduct {
  code?: string
  elkoCode?: string
  name?: string
  description?: string
  vendorCode?: string
  vendorName?: string
  categoryCode?: string
  categoryName?: string
  ean?: string
  price?: number
  stock?: number
  available?: boolean
  weight?: number
  images?: string[]
}

interface ElkoAvailability {
  price?: number
  stock?: number
  available?: boolean
}

interface ElkoCategory {
  code?: string
  name?: string
  parentCode?: string
}

interface ElkoVendor {
  code?: string
  name?: string
}

const REQUEST_DELAY_MS = 100

async function elkoFetch<T>(credentials: ElkoCredentials, endpoint: string): Promise<T> {
  const url = `${credentials.baseUrl.replace(/\/$/, '')}/${endpoint}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ELKO API ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export class ElkoAdapter implements ProviderAdapter {
  readonly key = 'elko'
  readonly name = 'ELKO'

  constructor(private readonly credentials: ElkoCredentials) {}

  async testConnection(): Promise<ProviderTestResult> {
    const start = Date.now()
    try {
      const cats = await elkoFetch<ElkoCategory[]>(this.credentials, 'Catalogs/Categories')
      return {
        success: true,
        message: `ELKO API conectat. ${Array.isArray(cats) ? cats.length : '?'} categorii găsite.`,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      }
    }
  }

  async fetchBrands(): Promise<NormalizedBrand[]> {
    const vendors = await elkoFetch<ElkoVendor[]>(this.credentials, 'Catalogs/Vendors')
    if (!Array.isArray(vendors)) return []

    return vendors
      .filter((v) => v.code && v.name)
      .map((v) => ({
        externalId: String(v.code),
        name: v.name!,
      }))
  }

  async fetchCategories(): Promise<NormalizedCategory[]> {
    const cats = await elkoFetch<ElkoCategory[]>(this.credentials, 'Catalogs/Categories')
    if (!Array.isArray(cats)) return []

    return cats
      .filter((c) => c.code && c.name)
      .map((c) => ({
        externalId: String(c.code),
        name: c.name!,
        parentExternalId: c.parentCode ? String(c.parentCode) : undefined,
      }))
  }

  async fetchProducts(options?: FetchProductsOptions): Promise<FetchProductsResult> {
    // Pasul 1: preia lista de produse
    const products = await elkoFetch<ElkoProduct[]>(this.credentials, 'Catalogs/Products')
    if (!Array.isArray(products)) return { products: [], nextCursor: undefined, hasMore: false }

    // Pasul 2: pentru fiecare produs preia availability (preț + stoc)
    // Limităm la produse cu cod valid
    const normalized: NormalizedProduct[] = []
    let i = 0

    for (const p of products) {
      const code = p.code || p.elkoCode
      if (!code) continue

      let price = p.price ?? 0
      let stock = p.stock ?? 0

      try {
        const avail = await elkoFetch<ElkoAvailability>(
          this.credentials,
          `Catalogs/Products/${code}/Availability`,
        )
        price = avail.price ?? price
        stock = avail.stock ?? stock
      } catch {
        // Continuăm cu datele de bază dacă availability eșuează
      }

      normalized.push({
        externalId: code,
        sku: code,
        name: p.name || code,
        description: p.description || undefined,
        price: price > 0 ? price : undefined,
        currency: 'EUR',
        stockQty: stock,
        inStock: stock > 0,
        images: Array.isArray(p.images) ? p.images : [],
        brandExternalId: p.vendorCode || undefined,
        categoryExternalId: p.categoryCode || undefined,
        attributes: {
          ...(p.ean ? { ean: p.ean } : {}),
          ...(p.weight ? { weight: String(p.weight) } : {}),
        },
        rawJson: p,
      })

      i++
      // Rate limiting — la fiecare 10 produse pauza de 100ms
      if (i % 10 === 0) await sleep(REQUEST_DELAY_MS)
    }

    return { products: normalized, nextCursor: undefined, hasMore: false }
  }
}
