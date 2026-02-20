/**
 * ALSO B2B Adapter
 *
 * ALSO livrează feed-ul prin SFTP (SSH, port 22)
 * Fișier: pricelist-1.csv (format multi-delimiter: TAB + semicolon)
 *
 * Structura CSV:
 *   COLOANA A (;-delimited): ProductID;Code;;Brand;EAN;Name;;Price;;cat1
 *   COLOANA B (;-delimited): cat2;cat3
 *   COLOANA C (;-delimited): cat4;;qty
 *
 * NOTĂ: SFTP necesită pachetul `ssh2-sftp-client` (npm install ssh2-sftp-client)
 * Dacă nu este disponibil, adapterul returnează eroare clară.
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

interface AlsoCredentials {
  host: string
  port: number
  username: string
  password: string
  filename: string // e.g. 'pricelist-1.csv'
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

function parseSemicolon(text: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '"') {
      if (inQuotes && next === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ';' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map((s) => s.replace(/^"|"$/g, '').trim())
}

function splitColumns(line: string): string[] {
  // Prima dată încearcă TAB
  let cols = line.split('\t')
  // Dacă nu, încearcă 4+ spații
  if (cols.length === 1) cols = line.split(/\s{4,}/)
  return cols.map((c) => c.trim())
}

interface AlsoParsedRow {
  productId: string
  code: string
  brand: string
  ean: string
  name: string
  price: number
  categories: string[]
}

function parseLine(line: string): AlsoParsedRow | null {
  const columns = splitColumns(line)
  const a = parseSemicolon(columns[0] || '')
  const b = parseSemicolon(columns[1] || '')
  const c = parseSemicolon(columns[2] || '')

  const productId = a[0]
  if (!productId || isNaN(parseInt(productId))) return null // linie de header sau goală

  const price = parseFloat((a[7] || '').replace(',', '.')) || 0

  // Categorii din toate coloanele (de la index 9 în A, tot B, tot C)
  const cats: string[] = []
  for (let i = 9; i < a.length; i++) if (a[i]) cats.push(a[i])
  for (const f of b) if (f && !/^\d+$/.test(f)) cats.push(f)
  for (const f of c) if (f && !/^\d+$/.test(f)) cats.push(f)

  return {
    productId,
    code: a[1] || '',
    brand: a[3] || '',
    ean: a[4] || '',
    name: a[5] || `Product ${productId}`,
    price,
    categories: [...new Set(cats)].filter(Boolean),
  }
}

// ─── SFTP Download ────────────────────────────────────────────────────────────

async function downloadViaSftp(credentials: AlsoCredentials): Promise<string> {
  // Dynamic import — necesită ssh2-sftp-client instalat
  let SftpClient: new () => {
    connect(cfg: object): Promise<void>
    get(remote: string, local?: string): Promise<string | Buffer>
    end(): Promise<void>
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SftpClient = require('ssh2-sftp-client')
  } catch {
    throw new Error(
      'Pachetul ssh2-sftp-client nu este instalat. Rulează: npm install ssh2-sftp-client',
    )
  }

  const sftp = new SftpClient()

  try {
    await sftp.connect({
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      readyTimeout: 30_000,
    })

    // get() fără dest returnează Buffer
    const buffer = await sftp.get(credentials.filename) as Buffer
    return buffer.toString('utf8')
  } finally {
    await sftp.end()
  }
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class AlsoAdapter implements ProviderAdapter {
  readonly key = 'also'
  readonly name = 'ALSO'

  constructor(private readonly credentials: AlsoCredentials) {}

  async testConnection(): Promise<ProviderTestResult> {
    const start = Date.now()
    try {
      const text = await downloadViaSftp(this.credentials)
      const lines = text.split('\n').filter((l) => l.trim()).length
      return {
        success: true,
        message: `ALSO SFTP conectat. Feed are ~${lines} linii.`,
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
    // Brandurile se extrag din produse — returnăm gol, sync le colectează
    return []
  }

  async fetchCategories(): Promise<NormalizedCategory[]> {
    // Categoriile vin din CSV, fără ierarhie explicită
    return []
  }

  async fetchProducts(_options?: FetchProductsOptions): Promise<FetchProductsResult> {
    const text = await downloadViaSftp(this.credentials)
    const lines = text.split(/\r?\n/)

    // Colectăm branduri și categorii unice pe parcurs
    const brandsSeen = new Set<string>()
    const categoriesSeen = new Set<string>()

    const products: NormalizedProduct[] = []

    for (const line of lines) {
      if (!line.trim()) continue
      const row = parseLine(line)
      if (!row) continue

      if (row.brand) brandsSeen.add(row.brand)
      if (row.categories[0]) categoriesSeen.add(row.categories[0])

      // Preț fără TVA (19%)
      const priceWithoutVAT = row.price > 0 ? row.price / 1.19 : undefined

      products.push({
        externalId: row.productId,
        sku: row.code || row.productId,
        name: row.name,
        price: priceWithoutVAT,
        currency: 'RON',
        stockQty: undefined, // ALSO nu oferă stoc în CSV pricelist
        inStock: row.price > 0, // presupunem în stoc dacă are preț
        images: [],
        attributes: {
          ...(row.ean ? { ean: row.ean } : {}),
          ...(row.brand ? { brand: row.brand } : {}),
          ...(row.categories[0] ? { main_category: row.categories[0] } : {}),
          ...(row.categories[1] ? { sub_category: row.categories[1] } : {}),
          ...(row.price ? { price_with_vat: String(row.price) } : {}),
        },
        rawJson: row,
      })
    }

    return { products, nextCursor: undefined, hasMore: false }
  }
}
