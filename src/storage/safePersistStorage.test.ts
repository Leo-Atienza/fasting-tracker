import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const { storage, asyncStorageMock } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  const asyncStorageMock = {
    getItem: vi.fn((k: string) => Promise.resolve(storage.has(k) ? storage.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => {
      storage.set(k, v);
      return Promise.resolve();
    }),
    removeItem: vi.fn((k: string) => {
      storage.delete(k);
      return Promise.resolve();
    }),
  };
  return { storage, asyncStorageMock };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

const { createSafeAsyncPersistStorage } = await import('@/src/storage/safePersistStorage');
const { clearPersistWriteError, getPersistWriteError } = await import(
  '@/src/storage/persistWriteErrors'
);

function rebuildStore<T = unknown>() {
  const store = createSafeAsyncPersistStorage<T>();
  if (!store) throw new Error('createSafeAsyncPersistStorage returned null');
  return store;
}

describe('safePersistStorage', () => {
  beforeEach(() => {
    storage.clear();
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();
    asyncStorageMock.getItem.mockImplementation((k: string) =>
      Promise.resolve(storage.has(k) ? storage.get(k)! : null),
    );
    asyncStorageMock.setItem.mockImplementation((k: string, v: string) => {
      storage.set(k, v);
      return Promise.resolve();
    });
    asyncStorageMock.removeItem.mockImplementation((k: string) => {
      storage.delete(k);
      return Promise.resolve();
    });
    clearPersistWriteError();
  });

  it('getItem returns null when key is missing', async () => {
    const store = rebuildStore();
    expect(await store.getItem('missing')).toBeNull();
  });

  it('getItem round-trips a value previously written by setItem', async () => {
    const store = rebuildStore<{ a: number }>();
    await store.setItem('app', { state: { a: 1 }, version: 0 });
    expect(await store.getItem('app')).toEqual({ state: { a: 1 }, version: 0 });
  });

  it('getItem on corrupt JSON returns null and removes the entry', async () => {
    storage.set('app', '{not-valid-json{{');
    const store = rebuildStore();
    expect(await store.getItem('app')).toBeNull();
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith('app');
    expect(storage.has('app')).toBe(false);
  });

  it('getItem swallows AsyncStorage.getItem rejection and returns null', async () => {
    asyncStorageMock.getItem.mockRejectedValueOnce(new Error('disk failure'));
    const store = rebuildStore();
    expect(await store.getItem('app')).toBeNull();
  });

  it('setItem failure is surfaced via persistWriteErrors', async () => {
    asyncStorageMock.setItem.mockRejectedValueOnce(new Error('quota exceeded'));
    const store = rebuildStore();
    await store.setItem('app', { state: { x: 1 }, version: 0 });
    const err = getPersistWriteError();
    expect(err).not.toBeNull();
    expect(err?.message).toBe('quota exceeded');
  });

  it('successful setItem does not record an error', async () => {
    const store = rebuildStore();
    await store.setItem('app', { state: { x: 1 }, version: 0 });
    expect(getPersistWriteError()).toBeNull();
    expect(storage.get('app')).toContain('"x":1');
  });

  it('removeItem swallows AsyncStorage.removeItem rejection', async () => {
    asyncStorageMock.removeItem.mockRejectedValueOnce(new Error('cannot remove'));
    const store = rebuildStore();
    await expect(store.removeItem('app')).resolves.not.toThrow();
  });

  it('reports non-Error rejections as Error-wrapped messages', async () => {
    asyncStorageMock.setItem.mockRejectedValueOnce('string failure');
    const store = rebuildStore();
    await store.setItem('app', { state: {}, version: 0 });
    const err = getPersistWriteError();
    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('string failure');
  });
});
