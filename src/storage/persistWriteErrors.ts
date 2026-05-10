type Listener = () => void;

const listeners = new Set<Listener>();
let lastWriteError: Error | null = null;

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
}

export function subscribePersistWriteErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPersistWriteError(): Error | null {
  return lastWriteError;
}

export function reportPersistWriteError(err: unknown): void {
  lastWriteError = err instanceof Error ? err : new Error(String(err));
  if (__DEV__) {
    console.warn('[persist] AsyncStorage setItem failed:', lastWriteError.message);
  }
  notify();
}

export function clearPersistWriteError(): void {
  lastWriteError = null;
  notify();
}
