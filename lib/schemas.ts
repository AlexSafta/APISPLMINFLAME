import { z } from 'zod'

// ─── Provider ───────────────────────────────────────────────────────────────

export const ProviderSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Provider = z.infer<typeof ProviderSchema>

// ─── Products query params ───────────────────────────────────────────────────

export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  q: z.string().optional(),
  provider: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minStock: z.coerce.number().int().optional(),
  maxStock: z.coerce.number().int().optional(),
  hasImages: z.coerce.boolean().optional(),
  hasDescription: z.coerce.boolean().optional(),
  updatedWithin: z.enum(['24h', '7d', '30d']).optional(),
  sort: z
    .enum(['price_asc', 'price_desc', 'newest', 'stock_desc', 'name_asc'])
    .default('newest'),
})

export type ProductsQuery = z.infer<typeof ProductsQuerySchema>

// ─── Sync ────────────────────────────────────────────────────────────────────

export const SyncRunSchema = z.object({
  providerKey: z.string().min(1),
  full: z.boolean().default(false),
})

export type SyncRun = z.infer<typeof SyncRunSchema>
