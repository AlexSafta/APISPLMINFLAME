/**
 * Provider Adapter Interface
 * 
 * Each provider must implement this interface.
 * Convention: provider key = lowercase slug, e.g. "emag", "ingram", "globiz"
 */

export interface NormalizedBrand {
  externalId: string
  name: string
}

export interface NormalizedCategory {
  externalId: string
  name: string
  parentExternalId?: string
}

export interface NormalizedProduct {
  externalId: string
  sku?: string
  name: string
  description?: string
  price?: number
  currency?: string
  stockQty?: number
  inStock: boolean
  url?: string
  images?: string[]
  brandExternalId?: string
  categoryExternalId?: string
  attributes?: Record<string, string>
  rawJson?: unknown
}

export interface FetchProductsOptions {
  cursor?: string         // pagination cursor / page token
  updatedSince?: Date     // delta sync: only products updated after this date
  limit?: number
}

export interface FetchProductsResult {
  products: NormalizedProduct[]
  nextCursor?: string     // null/undefined = no more pages
  hasMore: boolean
}

export interface ProviderTestResult {
  success: boolean
  message: string
  latencyMs?: number
}

export interface ProviderAdapter {
  /** Unique key matching Provider.key in DB */
  readonly key: string

  /** Human-readable name */
  readonly name: string

  /** Test connectivity and credentials */
  testConnection(): Promise<ProviderTestResult>

  /** Fetch all brands from provider */
  fetchBrands(): Promise<NormalizedBrand[]>

  /** Fetch all categories from provider */
  fetchCategories(): Promise<NormalizedCategory[]>

  /** Fetch products (paginated, supports delta sync) */
  fetchProducts(options?: FetchProductsOptions): Promise<FetchProductsResult>
}
