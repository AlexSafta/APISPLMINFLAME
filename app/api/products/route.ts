import { NextResponse } from 'next/server'
import { ProductsQuerySchema } from '@/lib/schemas'
import { getProducts, getFilterOptions } from '@/lib/services/products'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    const query = ProductsQuerySchema.parse(params)

    const [data, filterOptions] = await Promise.all([
      getProducts(query),
      getFilterOptions(),
    ])

    return NextResponse.json({ ...data, filterOptions })
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query params', details: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
