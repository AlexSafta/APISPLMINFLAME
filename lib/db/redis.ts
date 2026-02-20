import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedis() {
  if (!process.env.REDIS_URL) return null
  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
    client.on('error', (err) => {
      console.warn('[Redis] Connection error (non-fatal):', err.message)
    })
    return client
  } catch {
    return null
  }
}

export const redis = globalForRedis.redis ?? createRedis()
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis ?? undefined

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const val = await redis.get(key)
    return val ? (JSON.parse(val) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // non-fatal
  }
}
