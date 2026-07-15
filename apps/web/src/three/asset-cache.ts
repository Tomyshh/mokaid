/**
 * Disk-backed Cache API helper for large hashed 3D assets.
 * A new hash (filename) invalidates naturally; stale keys are pruned on open.
 */

const CACHE_NAME = "mokaid-assets-3d-v1";

function cacheAvailable(): boolean {
  return typeof caches !== "undefined";
}

/** Drop entries that no longer match any known URL we care about. */
async function pruneStale(cache: Cache, keepUrl: string): Promise<void> {
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((req) => req.url !== keepUrl && !keepUrl.endsWith(new URL(req.url).pathname))
      .map((req) => {
        // Keep only the current office (+ future assets under the same path pattern).
        // Safer: prune anything with a different office hash when loading office.
        const path = new URL(req.url).pathname;
        if (path.includes("/assets3d/office.") && req.url !== keepUrl) {
          return cache.delete(req);
        }
        return Promise.resolve(false);
      }),
  );
}

/**
 * Fetch an asset, preferably from Cache Storage. Reports 0–1 progress when
 * downloading from the network (Content-Length required for a smooth bar).
 */
export async function fetchAssetCached(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<ArrayBuffer> {
  const absolute = new URL(url, window.location.href).href;

  if (cacheAvailable()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await pruneStale(cache, absolute);
      const hit = await cache.match(absolute);
      if (hit) {
        onProgress?.(1);
        return await hit.arrayBuffer();
      }

      const response = await fetch(absolute);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }

      // Clone for cache; stream the original for progress if possible.
      const cached = response.clone();
      void cache.put(absolute, cached).catch(() => {
        /* quota / private mode — ignore */
      });

      return await readWithProgress(response, onProgress);
    } catch {
      // Fall through to a direct fetch when Cache API fails.
    }
  }

  const response = await fetch(absolute);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return readWithProgress(response, onProgress);
}

async function readWithProgress(
  response: Response,
  onProgress?: (progress: number) => void,
): Promise<ArrayBuffer> {
  const total = Number(response.headers.get("Content-Length") || 0);
  if (!response.body || !total || !onProgress) {
    const buf = await response.arrayBuffer();
    onProgress?.(1);
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress(Math.min(1, loaded / total));
    }
  }

  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress(1);
  return out.buffer;
}
