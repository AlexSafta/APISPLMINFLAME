'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

export function Topbar({ title }: { title?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set('q', q)
      else params.delete('q')
      params.set('page', '1')
      router.push(`/products?${params.toString()}`)
    },
    [q, router, searchParams]
  )

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      {title && <h1 className="text-base font-semibold">{title}</h1>}
      <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-64 pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </form>
    </header>
  )
}
