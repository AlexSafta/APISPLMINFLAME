import { z } from 'zod'

export const ProductQuerySchema = z.object({
  q: z.string().optional(),
  provider: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  minPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  minStock: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : undefined)),
  maxStock: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : undefined)),
  hasImages: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  hasDescription: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  updatedRecently: z.enum(['24h', '7d']).optional(),
  sort: z
    .enum(['price_asc', 'price_desc', 'newest', 'stock_desc', 'name_asc'])
    .optional()
    .default('newest'),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? '1') || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, parseInt(v ?? '24') || 24))),
})

export type ProductQuery = z.infer<typeof ProductQuerySchema>

export const SyncRunSchema = z.object({
  providerKey: z.string().min(1),
})
