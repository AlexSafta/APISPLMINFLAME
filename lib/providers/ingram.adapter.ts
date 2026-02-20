/**
 * Ingram Micro 24 Adapter
 *
 * Feed-uri disponibile:
 *   Availability (orar CSV): https://www.ingrammicro24.com/ro/api/availability/{apiKey}/
 *   Offer (zilnic ZIP/CSV):   https://www.ingrammicro24.com/ro/api/offer/{apiKey}/
 *
 * Autentificare: API Key în URL (nu header)
 *
 * Structura CSV Availability:
 *   p_id, p_pn, eancode, stockFree, stockRez, imStock, price, FinalPrice, ...
 */

import type {
  ProviderAdapter,
  ProviderTestResult,
  NormalizedBrand,
  NormalizedCategory,
  FetchProductsOptions,
  FetchProductsResult,
  NormalizedProduct,
} from './adapter.interface'

interface IngramCredentials {
  apiKey: string
}

const BASE = 'https://www.ingrammicro24.com'

async function downloadText(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!res.ok) throw new Error(`Ingram HTTP ${res.status}: ${url}`)
  return res.text()
}

function parseCSVLine(line: string, delimiter = ','): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  // Detectează delimitatorul (primul rând)
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','

  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/^["']|["']$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], delimiter)
    if (fields.length < 2) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = fields[idx] ?? ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function parseFloat2(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export class IngramAdapter implements ProviderAdapter {
  readonly key = 'ingram'
  readonly name = 'Ingram Micro 24'

  constructor(private readonly credentials: IngramCredentials) {}

  async testConnection(): Promise<ProviderTestResult> {
    const start = Date.now()
    try {
      const url = `${BASE}/ro/api/availability/${this.credentials.apiKey}/`
      const text = await downloadText(url)
      const preview = text.slice(0, 200)
      if (!preview.includes(',') && !preview.includes(';')) {
        throw new Error('Răspuns neașteptat — posibil API key invalid')
      }
      return {
        success: true,
        message: 'Ingram Micro 24 conectat. Feed availability accesibil.',
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      }
    }
  }

  async fetchBrands(): Promise<NormalizedBrand[]> {
    // Ingram nu are un endpoint dedicat pentru brands — le extragem din offer feed
    // Returnăm gol; brandurile se extrag din produse în sync
    return []
  }

  async fetchCategories(): Promise<NormalizedCategory[]> {
    // La fel — categoriile vin din offer feed
    return []
  }

  async fetchProducts(_options?: FetchProductsOptions): Promise<FetchProductsResult> {
    const url = `${BASE}/ro/api/availability/${this.credentials.apiKey}/`
    const text = await downloadText(url)
    const { rows } = parseCSV(text)

    const products: NormalizedProduct[] = rows
      .filter((r) => r.p_id || r.ImSKU || r.p_pn || r.VPN)
      .map((r) => {
        const externalId = r.p_id || r.ImSKU || r.p_pn || r.VPN
        const sku = r.p_pn || r.VPN || r.p_id
        const ean = r.eancode || r.EANCode || ''

        // Prețul — prioritate: FinalPrice > price > StdPrice > ListPrice
        const price =
          parseFloat2(r.FinalPrice || r.finalPrice) ||
          parseFloat2(r.price || r.StdPrice) ||
          parseFloat2(r.l_price || r.ListPrice) ||
          0

        // Stoc: local + central
        const localFree = parseInt(r.stockFree || r.FreeOnStock || '0') || 0
        const central = parseInt(r.imStock || r.CentralStock || '0') || 0
        const stock = localFree + central

        return {
          externalId,
          sku,
          name: r.p_name || r.Name || sku || externalId,
          price: price > 0 ? price : undefined,
          currency: 'EUR',
          stockQty: stock,
          inStock: stock > 0,
          images: [],
          attributes: {
            ...(ean ? { ean } : {}),
            ...(r.manufacturer_name || r.Brand ? { brand: r.manufacturer_name || r.Brand } : {}),
            ...(r.category_name || r.Category ? { category: r.category_name || r.Category } : {}),
            local_stock: String(localFree),
            central_stock: String(central),
          },
          rawJson: r,
        }
      })

    return { products, nextCursor: undefined, hasMore: false }
  }
}
