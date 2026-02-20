/**
 * DummyProvider — skeleton adapter, returns no data.
 * Use this as a template when implementing real providers.
 * 
 * To create a new provider:
 * 1. Copy this file to lib/providers/your-provider.adapter.ts
 * 2. Replace "dummy" key with your provider key (e.g. "emag")
 * 3. Implement each method using the provider's real API
 * 4. Register the adapter in lib/providers/registry.ts
 */

import type {
  ProviderAdapter,
  ProviderTestResult,
  NormalizedBrand,
  NormalizedCategory,
  FetchProductsOptions,
  FetchProductsResult,
} from './adapter.interface'

export class DummyProvider implements ProviderAdapter {
  readonly key = 'dummy'
  readonly name = 'Dummy Provider (Template)'

  // Inject credentials here when implementing a real provider
  // constructor(private readonly credentials: Record<string, string>) {}

  async testConnection(): Promise<ProviderTestResult> {
    // TODO: Make a real API call to verify credentials
    return {
      success: false,
      message: 'DummyProvider is a template — implement a real API call here.',
      latencyMs: 0,
    }
  }

  async fetchBrands(): Promise<NormalizedBrand[]> {
    // TODO: Call provider's brand/manufacturer endpoint
    // Example return:
    // return [{ externalId: '123', name: 'Samsung' }]
    return []
  }

  async fetchCategories(): Promise<NormalizedCategory[]> {
    // TODO: Call provider's category/taxonomy endpoint
    // Example return:
    // return [{ externalId: 'cat_1', name: 'Laptops', parentExternalId: undefined }]
    return []
  }

  async fetchProducts(_options?: FetchProductsOptions): Promise<FetchProductsResult> {
    // TODO: Call provider's product list endpoint
    // Handle pagination via _options.cursor
    // Handle delta sync via _options.updatedSince
    // 
    // Example implementation pattern:
    // const page = _options?.cursor ? parseInt(_options.cursor) : 1
    // const response = await this.apiClient.getProducts({ page, updatedSince: _options?.updatedSince })
    // return {
    //   products: response.items.map(this.mapProduct),
    //   nextCursor: response.hasNextPage ? String(page + 1) : undefined,
    //   hasMore: response.hasNextPage,
    // }
    return {
      products: [],
      nextCursor: undefined,
      hasMore: false,
    }
  }

  // private mapProduct(raw: YourApiProduct): NormalizedProduct {
  //   return {
  //     externalId: String(raw.id),
  //     sku: raw.sku,
  //     name: raw.title,
  //     description: raw.description,
  //     price: parseFloat(raw.price),
  //     currency: 'RON',
  //     inStock: raw.stock > 0,
  //     stockQty: raw.stock,
  //     url: `https://provider.com/products/${raw.slug}`,
  //     images: raw.images ?? [],
  //     brandExternalId: String(raw.brand_id),
  //     categoryExternalId: String(raw.category_id),
  //     attributes: {
  //       color: raw.color,
  //       weight: raw.weight_kg + 'kg',
  //     },
  //     rawJson: raw,
  //   }
  // }
}
