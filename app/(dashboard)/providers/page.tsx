import { getProviders } from '@/lib/services/providers'
import { listAdapterKeys } from '@/lib/providers/registry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Package, Tag, FolderOpen, RefreshCw, Plug } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function ProvidersPage() {
  const providers = await getProviders()
  const adapterKeys = new Set(listAdapterKeys())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Providers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your data provider integrations
        </p>
      </div>

      {providers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No providers yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run <code className="bg-muted px-1 rounded">npm run db:seed</code> to add default providers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const hasAdapter = adapterKeys.has(provider.key)
            return (
              <Link key={provider.id} href={`/providers/${provider.key}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-muted p-2">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{provider.name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">{provider.key}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={provider.enabled ? 'success' : 'secondary'}>
                          {provider.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {hasAdapter && (
                          <Badge variant="outline" className="text-xs">
                            <Plug className="h-3 w-3 mr-1" />
                            Adapter ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {provider.description && (
                      <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted p-2">
                        <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-semibold">{provider._count.products.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Products</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <Tag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-semibold">{provider._count.brands}</p>
                        <p className="text-xs text-muted-foreground">Brands</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <FolderOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-semibold">{provider._count.categories}</p>
                        <p className="text-xs text-muted-foreground">Categories</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Added {formatDate(provider.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
