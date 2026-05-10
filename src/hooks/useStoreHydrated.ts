import { useEffect, useState } from 'react';

import { useAppStore } from '@/src/store/useAppStore';

/** Single in-flight rehydrate for Strict Mode + one subscription site. */
let rehydrateOncePromise: Promise<void> | null = null;

function ensureRehydrate(): Promise<void> {
  if (!rehydrateOncePromise) {
    rehydrateOncePromise = Promise.resolve(useAppStore.persist.rehydrate()).then(
      () => undefined,
    );
  }
  return rehydrateOncePromise;
}

/** True after zustand rehydrates from AsyncStorage. */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    void ensureRehydrate().then(() => {
      setHydrated(useAppStore.persist.hasHydrated());
    });

    return unsub;
  }, []);

  return hydrated;
}
