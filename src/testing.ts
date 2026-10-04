import { vi } from 'vitest';

// KubeObject.useList/useGet return the SDK's full query-result type; tests
// stub them with plain [data, error] tuples of fixture objects.
export function mockedHook(hook: unknown) {
  return vi.mocked(hook as (...args: any[]) => any);
}
