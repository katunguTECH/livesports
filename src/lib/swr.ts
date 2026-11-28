// In-memory "stale-while-revalidate" cache for database reads.
// After the first load, visitors never wait for the database: an expired value
// is served immediately while a fresh one is fetched in the background.

type Entry = { data: unknown; freshUntil: number };

const g = globalThis as unknown as {
  __swrData?: Map<string, Entry>;
  __swrInflight?: Map<string, Promise<unknown>>;
};
const data = (g.__swrData ??= new Map<string, Entry>());
const inflight = (g.__swrInflight ??= new Map<string, Promise<unknown>>());

export function swr<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>
): Promise<T> {
  const hit = data.get(key);
  if (hit && hit.freshUntil > Date.now()) {
    return Promise.resolve(hit.data as T);
  }

  let pending = inflight.get(key) as Promise<T> | undefined;

  if (!pending) {
    const request: Promise<T> = load()
      .then((value) => {
        // Skip the write if the key was invalidated while we were loading.
        if (inflight.get(key) === request) {
          data.set(key, { data: value, freshUntil: Date.now() + ttlMs });
        }
        return value;
      })
      .finally(() => {
        if (inflight.get(key) === request) inflight.delete(key);
      });
    inflight.set(key, request);
    pending = request;
  }

  if (hit) {
    pending.catch((err) => console.error(`Refresh failed for ${key}:`, err));
    return Promise.resolve(hit.data as T);
  }

  return pending;
}

/** Forget a cached value, e.g. right after an admin change. */
export function invalidate(key: string): void {
  data.delete(key);
  inflight.delete(key);
}
