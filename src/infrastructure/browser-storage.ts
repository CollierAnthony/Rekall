export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** localStorage si le navigateur le permet, sinon un stockage en mémoire (perdu au rechargement). */
export function browserStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage;
    storage.getItem('revisions-tech:probe');
    return storage;
  } catch {
    return inMemoryStorage();
  }
}

export function inMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

/** Lit un objet JSON stocké sous `key` ; objet vide si absent ou illisible. */
export function readJsonRecord(storage: KeyValueStorage, key: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? { ...parsed } : {};
  } catch {
    return {};
  }
}
