import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore-backed storage adapter for supabase-js session persistence.
 *
 * expo-secure-store documents a ~2048 byte per-value limit, while a Supabase
 * session (JWT + user metadata) can exceed that. Values are therefore split
 * into UTF-8-safe chunks stored under numbered keys, with a metadata record
 * holding the chunk count. All writes for a given key are serialized so
 * concurrent auth-js writes cannot interleave.
 *
 * The session payload itself is written into SecureStore, which encrypts it
 * at rest via the Android Keystore / iOS Keychain.
 */

const CHUNK_SIZE = 1500; // safely below the 2048 byte per-value limit
const CHUNK_SUFFIX = '::chunk';
const META_SUFFIX = '::meta';

const memoryCache = new Map<string, string | null>();
const keyChains = new Map<string, Promise<any>>();

/** Approximate UTF-8 byte length without requiring Node's Buffer. */
function utf8Length(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      bytes += 4;
      i++; // low surrogate counted with its pair
    } else bytes += 3;
  }
  return bytes;
}

/** Split into chunks without splitting a surrogate pair. */
function splitChunks(value: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < value.length) {
    let end = Math.min(i + CHUNK_SIZE, value.length);
    if (end < value.length) {
      const prev = value.charCodeAt(end - 1);
      if (prev >= 0xd800 && prev <= 0xdbff) end--; // don't split a pair
    }
    chunks.push(value.slice(i, end));
    i = end;
  }
  return chunks;
}

/** Serialize async work per storage key. */
function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = keyChains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  keyChains.set(
    key,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
}

async function removeChunks(key: string): Promise<void> {
  const metaRaw = await SecureStore.getItemAsync(key + META_SUFFIX);
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as { n?: number };
      const n = typeof meta.n === 'number' ? meta.n : 0;
      for (let i = 0; i < n; i++) {
        await SecureStore.deleteItemAsync(key + CHUNK_SUFFIX + i);
      }
    } catch {
      // fall through to single-key delete below
    }
    await SecureStore.deleteItemAsync(key + META_SUFFIX);
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  getItem(key: string): Promise<string | null> {
    return serialize(key, async () => {
      try {
        const metaRaw = await SecureStore.getItemAsync(key + META_SUFFIX);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw) as { n?: number; legacy?: boolean };
          if (meta.legacy || !meta.n) {
            const direct = await SecureStore.getItemAsync(key);
            memoryCache.set(key, direct);
            return direct;
          }
          const parts: string[] = [];
          for (let i = 0; i < meta.n; i++) {
            const part = await SecureStore.getItemAsync(key + CHUNK_SUFFIX + i);
            if (part === null) {
              memoryCache.set(key, null);
              return null;
            }
            parts.push(part);
          }
          const value = parts.join('');
          memoryCache.set(key, value);
          return value;
        }
        // Legacy single-value entry (written before chunking existed).
        const direct = await SecureStore.getItemAsync(key);
        memoryCache.set(key, direct);
        return direct;
      } catch (err) {
        console.warn('[SecureStorage] getItem failed for', key, err);
        return memoryCache.get(key) ?? null;
      }
    });
  },

  setItem(key: string, value: string): Promise<void> {
    memoryCache.set(key, value);
    return serialize(key, async () => {
      try {
        // Remove any previous chunk layout first to avoid orphaned chunks.
        await removeChunks(key);

        if (utf8Length(value) <= CHUNK_SIZE) {
          await SecureStore.setItemAsync(key, value);
          await SecureStore.setItemAsync(
            key + META_SUFFIX,
            JSON.stringify({ n: 0, legacy: true })
          );
          return;
        }

        const chunks = splitChunks(value);
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(key + CHUNK_SUFFIX + i, chunks[i]);
        }
        await SecureStore.setItemAsync(
          key + META_SUFFIX,
          JSON.stringify({ n: chunks.length, legacy: false })
        );
      } catch (err) {
        console.warn('[SecureStorage] setItem failed for', key, err);
        throw err;
      }
    });
  },

  removeItem(key: string): Promise<void> {
    memoryCache.delete(key);
    return serialize(key, async () => {
      try {
        await removeChunks(key);
      } catch (err) {
        console.warn('[SecureStorage] removeItem failed for', key, err);
      }
    });
  },
};
