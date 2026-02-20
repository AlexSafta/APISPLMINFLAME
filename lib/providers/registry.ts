/**
 * Provider Registry — sursa de adevăr pentru toate adapterele înregistrate.
 */

import type { ProviderAdapter } from './adapter.interface'
import { DummyProvider } from './dummy.adapter'
import { NodAdapter } from './nod.adapter'
import { ElkoAdapter } from './elko.adapter'
import { IngramAdapter } from './ingram.adapter'
import { AlsoAdapter } from './also.adapter'

const adapters: Map<string, () => ProviderAdapter> = new Map()

// Skeleton adapter — template
adapters.set('dummy', () => new DummyProvider())

// NOD B2B — HMAC-SHA1
// Credențiale: NOD_API_USER + NOD_API_KEY din https://shop.nod.ro/api-integrations/api-information
adapters.set('nod', () => new NodAdapter({
  apiUser: process.env.NOD_API_USER!,
  apiKey: process.env.NOD_API_KEY!,
}))

// ELKO — Bearer JWT
// Credențiale: ELKO_API_TOKEN din https://roapi.elko.cloud
adapters.set('elko', () => new ElkoAdapter({
  baseUrl: process.env.ELKO_API_BASE_URL || 'https://roapi.elko.cloud/v3.0/',
  token: process.env.ELKO_API_TOKEN!,
}))

// Ingram Micro 24 — API Key în URL
// Credențiale: IM_API_KEY din https://www.ingrammicro24.com - Account > Access via API
adapters.set('ingram', () => new IngramAdapter({
  apiKey: process.env.IM_API_KEY!,
}))

// ALSO — SFTP (SSH port 22)
// Credențiale: ALSO_FTP_* + necesită: npm install ssh2-sftp-client
adapters.set('also', () => new AlsoAdapter({
  host: process.env.ALSO_FTP_HOST || 'paco.also.com',
  port: parseInt(process.env.ALSO_FTP_PORT || '22'),
  username: process.env.ALSO_FTP_USER!,
  password: process.env.ALSO_FTP_PASSWORD!,
  filename: process.env.ALSO_FEED_FILENAME || 'pricelist-1.csv',
}))

export function getAdapter(key: string): ProviderAdapter | null {
  const factory = adapters.get(key)
  return factory ? factory() : null
}

export function listAdapterKeys(): string[] {
  return Array.from(adapters.keys())
}
