'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Skeleton } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import { ProductsQuery } from '@/lib/schemas'
import {
  Package, LayoutGrid, List, Filter, RefreshCw,
  ChevronLeft, ChevronRight, ExternalLink, Image
} from 'lucide-react'
import Link from 'next/link'

interface FilterOptions {
  providers: { key: string; name: string }[]
  brands: { slug: string; name: string }[]
  categories: { slug: string; name: string }[]
}

interface ProductItem {
  id: string
  name: string
  sku: string | null
  price: number | null
  currency: string | null
  inStock: boolean
  stockQty: number | null
  images: string[]
  url: string | null
  updatedAt: string
  provider: { key: string; name: string }
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
}

interface PageData {
  items: ProductItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Props {
  initialData: PageData
  filterOptions: FilterOptions
  initialQuery: ProductsQuery
}

async function fetchProducts(params: Record<string, string>): Promise<PageData & { filterOptions: FilterOptions }> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/products?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function ProductsClient({ initialData, filterOptions, initialQuery }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [showFilters, setShowFilters] = useState(false)

  const params = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([, v]) => v !== '')
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    initialData: { ...initialData, filterOptions },
    placeholderData: (prev) => prev,
  })

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      next.set('page', '1')
      router.push(`/products?${next.toString()}`)
    },
    [router, searchParams]
  )

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', String(p))
    router.push(`/products?${next.toString()}`)
  }

  const { items, total, page, totalPages } = data ?? initialData
  const fo = filterOptions

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} products total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="icon" onClick={() => setView('table')}
            className={view === 'table' ? 'bg-accent' : ''}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setView('grid')}
            className={view === 'grid' ? 'bg-accent' : ''}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-sm">Filters</h3>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider</label>
                  <Select value={params.provider ?? ''} onChange={e => updateParam('provider', e.target.value || undefined)}>
                    <option value="">All providers</option>
                    {fo.providers.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</label>
                  <Select value={params.brand ?? ''} onChange={e => updateParam('brand', e.target.value || undefined)}>
                    <option value="">All brands</option>
                    {fo.brands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
                  <Select value={params.category ?? ''} onChange={e => updateParam('category', e.target.value || undefined)}>
                    <option value="">All categories</option>
                    {fo.categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Availability</label>
                  <Select value={params.inStock ?? ''} onChange={e => updateParam('inStock', e.target.value || undefined)}>
                    <option value="">All</option>
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Updated</label>
                  <Select value={params.updatedWithin ?? ''} onChange={e => updateParam('updatedWithin', e.target.value || undefined)}>
                    <option value="">Any time</option>
                    <option value="24h">Last 24h</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Min Price</label>
                    <Input type="number" placeholder="0" value={params.minPrice ?? ''} onChange={e => updateParam('minPrice', e.target.value || undefined)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Max Price</label>
                    <Input type="number" placeholder="∞" value={params.maxPrice ?? ''} onChange={e => updateParam('maxPrice', e.target.value || undefined)} className="mt-1" />
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/products')}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Sort + loading */}
          <div className="flex items-center justify-between">
            <Select
              value={params.sort ?? 'newest'}
              onChange={e => updateParam('sort', e.target.value)}
              className="w-40"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="stock_desc">Stock ↓</option>
              <option value="name_asc">Name A-Z</option>
            </Select>
            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            )}
          </div>

          {/* Empty state */}
          {!isLoading && items.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">No products found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {total === 0
                    ? 'Run a sync to import products from your providers.'
                    : 'Try adjusting your filters.'}
                </p>
                {total === 0 && (
                  <Link href="/sync-jobs" className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    <RefreshCw className="h-4 w-4" />
                    Run Sync
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {/* Table view */}
          {!isLoading && view === 'table' && items.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Brand</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Updated</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 group">
                        <td className="px-4 py-3">
                          <Link href={`/products/${product.id}`} className="font-medium hover:underline line-clamp-1">
                            {product.name}
                          </Link>
                          {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{product.provider.name}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{product.brand?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatPrice(product.price, product.currency ?? undefined)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={product.inStock ? 'success' : 'destructive'}>
                            {product.inStock ? `In Stock${product.stockQty != null ? ` (${product.stockQty})` : ''}` : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(product.updatedAt)}</td>
                        <td className="px-4 py-3">
                          {product.url && (
                            <a href={product.url} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Grid view */}
          {!isLoading && view === 'grid' && items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map(product => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt={product.name} className="object-contain h-full w-full p-2" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      <p className="text-sm font-semibold">{formatPrice(product.price, product.currency ?? undefined)}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={product.inStock ? 'success' : 'destructive'} className="text-xs">
                          {product.inStock ? 'In Stock' : 'Out'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{product.provider.name}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total.toLocaleString()} total)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
