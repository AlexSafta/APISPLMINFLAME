// Re-export pentru backwards compatibility cu sync-runner.ts vechi
export type { ProviderAdapter as AdapterInterface } from './adapter.interface'
export { getAdapter, listAdapterKeys } from './registry'
