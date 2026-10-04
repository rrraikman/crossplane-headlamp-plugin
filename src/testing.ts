import { vi } from 'vitest';

// KubeObject.useList/useGet return the SDK's full query-result type; tests
// stub them with plain [data, error] tuples of fixture objects.
export function mockedHook(hook: unknown) {
  return vi.mocked(hook as (...args: any[]) => any);
}

// Routes the shared KubeObject.useList mock by each dynamic class's apiName.
// Results are built once so references stay stable across renders, as they
// are with the real hook; a fresh array per call would re-trigger effects.
export function mockListsByPlural(useList: unknown, itemsByPlural: Record<string, any[]>) {
  const results: Record<string, [any[], null]> = Object.fromEntries(
    Object.entries(itemsByPlural).map(([plural, items]) => [
      plural,
      [items.map(json => ({ jsonData: json, metadata: json.metadata })), null],
    ])
  );
  const empty: [any[], null] = [[], null];
  mockedHook(useList).mockImplementation(function (this: { apiName: string }) {
    return results[this.apiName] ?? empty;
  });
}
