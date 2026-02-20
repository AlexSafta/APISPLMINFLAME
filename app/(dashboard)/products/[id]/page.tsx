import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/services/products'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import { ExternalLink, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductById(params.id)
  if (!product) notFound()

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{product.provider.name}</Badge>
              {product.brand && <Badge variant="outline">{product.brand.name}</Badge>}
              {product.category && <Badge variant="outline">{product.category.name}</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.sku && (
              <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
            )}
          </div>

          {/* Images */}
          {product.images.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.images.slice(0, 6).map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${product.name} image ${i + 1}`}
                        className="aspect-square object-contain rounded-md border bg-muted hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
                {product.images.length > 6 && (
                  <p className="text-xs text-muted-foreground mt-2">+{product.images.length - 6} more images</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Attributes */}
          {product.attributes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {product.attributes.map((attr) => (
                      <tr key={attr.id} className="border-b last:border-0 odd:bg-muted/30">
                        <td className="px-4 py-2 font-medium text-muted-foreground w-1/3">{attr.key}</td>
                        <td className="px-4 py-2">{attr.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — pricing & info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Price */}
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(product.price ? Number(product.price) : null, product.currency ?? undefined)}
                </p>
                <Badge variant={product.inStock ? 'success' : 'destructive'} className="mt-2">
                  {product.inStock
                    ? `In Stock${product.stockQty != null ? ` (${product.stockQty})` : ''}`
                    : 'Out of Stock'}
                </Badge>
              </div>

              {/* External link */}
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on {product.provider.name}
                </a>
              )}

              <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-medium text-foreground">{product.provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>External ID</span>
                  <span className="font-mono">{product.externalId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last updated</span>
                  <span>{formatDate(product.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price history */}
          {product.priceHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Price History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.priceHistory.slice(0, 10).map((ph) => (
                      <tr key={ph.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">
                          {formatPrice(Number(ph.price), ph.currency)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(ph.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
