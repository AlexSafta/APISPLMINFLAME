import { getProducts, getFilterOptions } from '@/lib/services/products'
import { ProductsQuerySchema } from '@/lib/schemas'
import { ProductsClient } from './products-client'

interface Props {
  searchParams: Record<string, string | string[] | undefined>
}

function toStr(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function ProductsPage({ searchParams }: Props) {
  const raw = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, toStr(v)])
  )

  const query = ProductsQuerySchema.parse(raw)
  const [data, filterOptions] = await Promise.all([
    getProducts(query),
    getFilterOptions(),
  ])

  return (
    <ProductsClient
      initialData={data}
      filterOptions={filterOptions}
      initialQuery={query}
    />
  )
}
