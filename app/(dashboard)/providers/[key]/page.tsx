import { notFound } from 'next/navigation'
import { getProviderByKey } from '@/lib/services/providers'
import { ProviderDetailClient } from './provider-detail-client'

interface Props {
  params: { key: string }
}

export default async function ProviderDetailPage({ params }: Props) {
  const provider = await getProviderByKey(params.key)
  if (!provider) notFound()

  return <ProviderDetailClient provider={provider} />
}
