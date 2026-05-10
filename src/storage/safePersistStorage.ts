import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

import { reportPersistWriteError } from '@/src/storage/persistWriteErrors';

/** AsyncStorage-backed persist with tolerant reads (corrupt JSON cleared). Write failures are reported via `persistWriteErrors`. */
export function createSafeAsyncPersistStorage<T>() {
  return createJSONStorage<T>(() => ({
    getItem: async (name) => {
      try {
        const raw = await AsyncStorage.getItem(name);
        if (raw === null) return null;
        try {
          JSON.parse(raw);
          return raw;
        } catch {
          await AsyncStorage.removeItem(name).catch(() => {});
          return null;
        }
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await AsyncStorage.setItem(name, value);
      } catch (e) {
        reportPersistWriteError(e);
      }
    },
    removeItem: async (name) => {
      try {
        await AsyncStorage.removeItem(name);
      } catch {
        /* noop */
      }
    },
  }));
}
