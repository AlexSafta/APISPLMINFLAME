import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'
import Link from 'next/link'

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: {
      provider: { select: { key: true, name: true } },
      _count: { select: { products: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brands</h1>
        <p className="text-sm text-muted-foreground mt-1">{brands.length} brands across all providers</p>
      </div>

      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No brands yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Brands will appear here after running a sync.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Brand</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Products</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/products?brand=${brand.slug}`} className="font-medium hover:underline">
                        {brand.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{brand.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{brand.provider.name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{brand._count.products}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
