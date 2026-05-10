import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

import {
  clearPersistWriteError,
  getPersistWriteError,
  reportPersistWriteError,
  subscribePersistWriteErrors,
} from '@/src/storage/persistWriteErrors';

describe('persistWriteErrors module (the wiring under <PersistErrorBanner />)', () => {
  afterEach(() => {
    clearPersistWriteError();
  });

  it('starts with no error (or whatever the previous test left, then cleared)', () => {
    expect(getPersistWriteError()).toBeNull();
  });

  it('reportPersistWriteError stores the Error and notifies subscribers', () => {
    const seen = vi.fn();
    const unsubscribe = subscribePersistWriteErrors(seen);

    reportPersistWriteError(new Error('quota exceeded'));
    expect(seen).toHaveBeenCalledTimes(1);
    expect(getPersistWriteError()?.message).toBe('quota exceeded');

    reportPersistWriteError(new Error('disk full'));
    expect(seen).toHaveBeenCalledTimes(2);
    expect(getPersistWriteError()?.message).toBe('disk full');

    unsubscribe();
    reportPersistWriteError(new Error('after unsubscribe'));
    expect(seen).toHaveBeenCalledTimes(2);
    expect(getPersistWriteError()?.message).toBe('after unsubscribe');
  });

  it('clearPersistWriteError resets to null and notifies', () => {
    const seen = vi.fn();
    const unsubscribe = subscribePersistWriteErrors(seen);

    reportPersistWriteError(new Error('a'));
    seen.mockClear();
    clearPersistWriteError();
    expect(getPersistWriteError()).toBeNull();
    expect(seen).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('subscriber that throws does not break notification of other subscribers', () => {
    const goodA = vi.fn();
    const evil = vi.fn(() => {
      throw new Error('subscriber went bad');
    });
    const goodB = vi.fn();
    const unsubA = subscribePersistWriteErrors(goodA);
    const unsubEvil = subscribePersistWriteErrors(evil);
    const unsubB = subscribePersistWriteErrors(goodB);

    reportPersistWriteError(new Error('boom'));
    expect(goodA).toHaveBeenCalledTimes(1);
    expect(evil).toHaveBeenCalledTimes(1);
    expect(goodB).toHaveBeenCalledTimes(1);

    unsubA();
    unsubEvil();
    unsubB();
  });

  it('non-Error inputs are wrapped into Error instances', () => {
    reportPersistWriteError('a string');
    expect(getPersistWriteError()).toBeInstanceOf(Error);
    expect(getPersistWriteError()?.message).toBe('a string');

    reportPersistWriteError({ code: 5 });
    expect(getPersistWriteError()).toBeInstanceOf(Error);
    expect(getPersistWriteError()?.message).toBe('[object Object]');
  });

  it('multiple subscribers can be added and removed independently', () => {
    const a = vi.fn();
    const b = vi.fn();

    const unsubA = subscribePersistWriteErrors(a);
    const unsubB = subscribePersistWriteErrors(b);

    reportPersistWriteError(new Error('1'));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    reportPersistWriteError(new Error('2'));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);

    unsubB();
  });
});
