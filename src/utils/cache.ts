import Redis from 'ioredis'

// Singleton Redis client
let client: Redis | null = null

function getRedis(): Redis | null {
  try {
    if (!client) {
      const url = process.env.REDIS_URL || 'redis://localhost:6379'
      client = new Redis(url, { lazyConnect: true })
      // connect in background; ignore failures (will just skip cache)
      client.connect().catch(() => {})
    }
    return client
  } catch {
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(key, JSON.stringify(value), 'EX', Math.max(1, ttlSeconds))
  } catch {
    // no-op if cache fails
  }
}

export async function cacheWrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached != null) return cached
  const fresh = await fetcher()
  cacheSet(key, fresh, ttlSeconds).catch(() => {})
  return fresh
}

// Atomic increment helper with optional TTL
export async function cacheIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const val = await r.incr(key)
    if (ttlSeconds && ttlSeconds > 0) {
      // Only set expiry if the key is new (race-safe enough for our use-case)
      const ttl = await r.ttl(key)
      if (ttl < 0) {
        await r.expire(key, Math.max(1, ttlSeconds))
      }
    }
    return val
  } catch {
    return null
  }
}
