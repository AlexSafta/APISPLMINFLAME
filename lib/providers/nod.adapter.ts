/**
 * NOD B2B API Adapter
 *
 * Documentatie: https://api.b2b.nod.ro
 * Autentificare: HMAC-SHA1
 *
 * IMPORTANT: Signature = HMAC-SHA1(API_KEY, METHOD + QueryString + User + Date)
 * NU include path-ul în signature — doar query string!
 */

import crypto from 'crypto'
import type {
  ProviderAdapter,
  ProviderTestResult,
  NormalizedBrand,
  NormalizedCategory,
  FetchProductsOptions,
  FetchProductsResult,
  NormalizedProduct,
} from './adapter.interface'

const BASE_URL = 'https://api.b2b.nod.ro'

interface NodCredentials {
  apiUser: string
  apiKey: string
}

// ─── Raw types from NOD API ───────────────────────────────────────────────────

interface NodProduct {
  id: string
  name: string
  code: string
  title?: string
  description?: string
  long_description?: string
  warranty?: number
  warranty_type?: string
  product_category_id?: number | string
  product_category_name?: string
  manufacturer_id?: string
  manufacturer_name?: string
  min_quantity?: number
  stock_value?: number
  stock?: number
  supplier_stock_value?: number
  reserved_stock_value?: number
  price?: number | string
  special_price?: number | string
  catalog_price?: number | string
  promo_price?: number | string
  ron_price?: number | string
  ron_promo_price?: number | string
  ron_catalog_price?: number | string
  currency?: string
  discount?: number | string
  vat_percent?: number
  has_resealed?: number | string
  ean?: string
  original_code?: string
  original_price?: number | string
  original_currency?: string
  images?: string
  pictures?: NodPicture[] | { picture?: NodPicture | NodPicture[] }
  fault_code?: number | string
  defect?: string
  promotions?: unknown[]
}

interface NodPicture {
  url_overlay_picture?: string
  url_thumbnail_picture?: string
}

interface NodManufacturer {
  id: string
  name: string
}

interface NodCategory {
  id: string | number
  name: string
  parent_id?: string | number
  children?: NodCategory[] | { children?: NodCategory | NodCategory[] }
}

interface NodStockChange {
  id: string
  code: string
  stock_value: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHeaders(credentials: NodCredentials, method: string, queryString: string): Record<string, string> {
  const date = new Date().toUTCString()

  // Signature = HMAC-SHA1(apiKey, METHOD + queryString + apiUser + date)
  // NU include path-ul, doar query string-ul (fara "?")
  const signatureString = `${method.toUpperCase()}${queryString}${credentials.apiUser}${date}`
  const signature = crypto.createHmac('sha1', credentials.apiKey).update(signatureString).digest('hex')

  return {
    'Date': date,
    'X-NodWS-User': credentials.apiUser,
    'X-NodWS-Accept': 'json',
    'X-NodWS-Auth': signature,
  }
}

async function nodFetch<T>(
  credentials: NodCredentials,
  path: string,
  params: Record<string, string | string[]> = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)

  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach((val) => url.searchParams.append(`${k}[]`, val))
    } else {
      url.searchParams.set(k, v)
    }
  }

  // Query string pentru signature (fara "?")
  const qs = url.search ? url.search.slice(1) : ''
  const headers = buildHeaders(credentials, 'GET', qs)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    // Timeout 3 minute pentru full feed
    signal: AbortSignal.timeout(180_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`NOD API ${res.status} ${res.statusText}: ${text.slice(0, 300)}`)
  }

  return res.json() as Promise<T>
}

// ─── Parsers (portate din codul vechi JS) ─────────────────────────────────────

function parsePrice(value: unknown): number {
  if (!value) return 0
  const parsed = parseFloat(String(value))
  return isNaN(parsed) ? 0 : parsed
}

function extractPrice(p: NodProduct): number {
  // Preferă ron_price pentru consistență în RON
  const candidates = [p.ron_promo_price, p.ron_price, p.promo_price, p.price]
  for (const c of candidates) {
    const v = parsePrice(c)
    if (v > 0) return v
  }
  return 0
}

function extractStock(p: NodProduct): number {
  if (p.stock_value !== undefined) return parseInt(String(p.stock_value)) || 0
  if (p.stock !== undefined) return parseInt(String(p.stock)) || 0
  return 0
}

function extractImages(p: NodProduct): string[] {
  const images: string[] = []

  // Cazul 1: câmp images ca string (URL sau CSV de URL-uri)
  if (p.images && typeof p.images === 'string' && p.images !== 'nan') {
    images.push(...p.images.split(',').map((u) => u.trim()).filter(Boolean))
  }

  // Cazul 2: pictures ca array de obiecte
  if (p.pictures) {
    if (Array.isArray(p.pictures)) {
      for (const pic of p.pictures as NodPicture[]) {
        if (pic.url_overlay_picture) images.push(pic.url_overlay_picture)
        else if (pic.url_thumbnail_picture) images.push(pic.url_thumbnail_picture)
      }
    } else if (typeof p.pictures === 'object') {
      const inner = (p.pictures as { picture?: NodPicture | NodPicture[] }).picture
      if (inner) {
        const arr = Array.isArray(inner) ? inner : [inner]
        for (const pic of arr) {
          if (pic.url_overlay_picture) images.push(pic.url_overlay_picture)
          else if (pic.url_thumbnail_picture) images.push(pic.url_thumbnail_picture)
        }
      }
    }
  }

  return [...new Set(images)] // dedup
}

function extractProductsFromResponse(raw: unknown): NodProduct[] {
  if (!raw) return []

  // Array direct
  if (Array.isArray(raw)) return raw as NodProduct[]

  const obj = raw as Record<string, unknown>

  // { products: [...] }
  if (obj.products) {
    return Array.isArray(obj.products) ? (obj.products as NodProduct[]) : [obj.products as NodProduct]
  }

  // { result: { products: [...] } } sau { result: [...] }
  if (obj.result) {
    if (Array.isArray(obj.result)) return obj.result as NodProduct[]
    const r = obj.result as Record<string, unknown>
    if (r.products) {
      return Array.isArray(r.products) ? (r.products as NodProduct[]) : [r.products as NodProduct]
    }
  }

  // Produs singular
  if ((obj as NodProduct).id || (obj as NodProduct).code) return [obj as NodProduct]

  return []
}

function extractCategoriesFlat(raw: unknown): NodCategory[] {
  const result: NodCategory[] = []

  function flatten(cats: NodCategory[]) {
    for (const c of cats) {
      result.push({ id: c.id, name: c.name, parent_id: c.parent_id })
      if (c.children) {
        if (Array.isArray(c.children)) {
          flatten(c.children as NodCategory[])
        } else {
          const inner = (c.children as { children?: NodCategory | NodCategory[] }).children
          if (inner) flatten(Array.isArray(inner) ? inner : [inner])
        }
      }
    }
  }

  if (!raw) return result

  if (Array.isArray(raw)) {
    flatten(raw as NodCategory[])
  } else {
    const obj = raw as Record<string, unknown>
    const list = obj.product_categories || obj.categories || obj.result
    if (Array.isArray(list)) flatten(list as NodCategory[])
  }

  return result
}

function normalizeProduct(p: NodProduct): NormalizedProduct {
  const price = extractPrice(p)
  const stock = extractStock(p)
  const images = extractImages(p)

  return {
    externalId: p.id,
    sku: p.code || p.original_code || undefined,
    name: p.title || p.name || `NOD-${p.id}`,
    description: p.description || undefined,
    price: price > 0 ? price : undefined,
    currency: 'RON', // stocăm în RON (ron_price)
    stockQty: stock,
    inStock: stock > 0,
    images,
    brandExternalId: p.manufacturer_id || undefined,
    categoryExternalId: p.product_category_id ? String(p.product_category_id) : undefined,
    attributes: {
      ...(p.ean ? { ean: p.ean } : {}),
      ...(p.code ? { code: p.code } : {}),
      ...(p.warranty ? { warranty_months: String(p.warranty) } : {}),
      ...(p.warranty_type ? { warranty_type: p.warranty_type } : {}),
      ...(p.vat_percent ? { vat_percent: String(p.vat_percent) } : {}),
      ...(p.catalog_price ? { catalog_price_eur: String(parsePrice(p.catalog_price)) } : {}),
      ...(p.ron_catalog_price ? { catalog_price_ron: String(parsePrice(p.ron_catalog_price)) } : {}),
      ...(p.min_quantity ? { min_quantity: String(p.min_quantity) } : {}),
      ...(p.has_resealed ? { has_resealed: '1' } : {}),
      ...(p.fault_code ? { fault_code: String(p.fault_code) } : {}),
      ...(p.defect ? { defect: p.defect } : {}),
      ...(p.currency ? { original_currency: p.currency } : {}),
      ...(p.price ? { price_original: String(parsePrice(p.price)) } : {}),
    },
    rawJson: p,
  }
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class NodAdapter implements ProviderAdapter {
  readonly key = 'nod'
  readonly name = 'NOD B2B'

  constructor(private readonly credentials: NodCredentials) {}

  async testConnection(): Promise<ProviderTestResult> {
    const start = Date.now()
    try {
      await nodFetch<unknown>(this.credentials, '/product-categories/', {})
      return {
        success: true,
        message: 'Conexiune NOD B2B API reusita.',
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
    const raw = await nodFetch<unknown>(this.credentials, '/manufacturers/', {
      count: '10000',
      order_by: 'name',
      order_direction: 'asc',
    })

    let items: NodManufacturer[] = []

    if (Array.isArray(raw)) {
      items = raw as NodManufacturer[]
    } else {
      const obj = raw as Record<string, unknown>
      if (obj.manufacturers) {
        items = Array.isArray(obj.manufacturers)
          ? (obj.manufacturers as NodManufacturer[])
          : [obj.manufacturers as NodManufacturer]
      }
    }

    return items.filter((m) => m.id && m.name).map((m) => ({
      externalId: String(m.id),
      name: m.name,
    }))
  }

  async fetchCategories(): Promise<NormalizedCategory[]> {
    const raw = await nodFetch<unknown>(this.credentials, '/product-categories/', {})
    const flat = extractCategoriesFlat(raw)

    return flat
      .filter((c) => c.id && c.name)
      .map((c) => ({
        externalId: String(c.id),
        name: c.name,
        parentExternalId:
          c.parent_id && String(c.parent_id) !== '0' ? String(c.parent_id) : undefined,
      }))
  }

  async fetchProducts(options?: FetchProductsOptions): Promise<FetchProductsResult> {
    // Delta sync rapid via stock-changes
    if (options?.updatedSince && options.cursor !== 'full') {
      return this.fetchStockChanges(options.updatedSince)
    }

    // Full feed
    const raw = await nodFetch<unknown>(this.credentials, '/products/full-feed', {
      format: 'json',
      include_inactive: '0',
      show_extended_info: '1',
      show_product_properties: '0',
    })

    const rows = extractProductsFromResponse(raw)
    const products = rows
      .filter((r) => r.id || r.code)
      .map((r) => normalizeProduct(r))

    return { products, nextCursor: undefined, hasMore: false }
  }

  private async fetchStockChanges(updatedSince: Date): Promise<FetchProductsResult> {
    const since = updatedSince.toISOString().replace('T', ' ').slice(0, 19)

    let raw: unknown
    try {
      raw = await nodFetch<unknown>(this.credentials, '/products/stock-changes', {
        changedfrom: since,
      })
    } catch {
      // Dacă nu există modificări, returnam gol
      return { products: [], nextCursor: undefined, hasMore: false }
    }

    const changes: NodStockChange[] = []
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      const list = obj.result || obj.results || raw
      if (Array.isArray(list)) {
        changes.push(...(list as NodStockChange[]))
      }
    }

    const products: NormalizedProduct[] = changes
      .filter((c) => c.id)
      .map((c) => ({
        externalId: c.id,
        sku: c.code,
        name: c.code || c.id,
        inStock: (c.stock_value ?? 0) > 0,
        stockQty: c.stock_value ?? 0,
      }))

    return { products, nextCursor: undefined, hasMore: false }
  }
}
