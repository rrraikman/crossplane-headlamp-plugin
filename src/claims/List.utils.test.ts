import { describe, expect, test } from 'vitest';
import { ClaimRow, sortByReady } from './List.utils';

function makeRow(overrides: Partial<ClaimRow> & { name: string }): ClaimRow {
  return {
    namespace: 'default',
    kind: 'XClaim',
    group: 'example.io',
    version: 'v1',
    plural: 'xclaims',
    ready: 'True',
    synced: 'True',
    creationTimestamp: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('sortByReady', () => {
  test('returns a new array without mutating the original', () => {
    const rows = [makeRow({ name: 'a' })];
    const result = sortByReady(rows);
    expect(result).not.toBe(rows);
  });

  test('not-ready rows sort before ready rows', () => {
    const rows = [
      makeRow({ name: 'ready', ready: 'True', synced: 'True' }),
      makeRow({ name: 'not-ready', ready: 'False', synced: 'True' }),
    ];
    const result = sortByReady(rows);
    expect(result[0].name).toBe('not-ready');
    expect(result[1].name).toBe('ready');
  });

  test('a row with synced False is treated as not-ready', () => {
    const rows = [
      makeRow({ name: 'ready', ready: 'True', synced: 'True' }),
      makeRow({ name: 'unsynced', ready: 'True', synced: 'False' }),
    ];
    const result = sortByReady(rows);
    expect(result[0].name).toBe('unsynced');
  });

  test('within the not-ready group, rows sort by namespace then name', () => {
    const rows = [
      makeRow({ name: 'b', namespace: 'beta', ready: 'False', synced: 'True' }),
      makeRow({ name: 'a', namespace: 'beta', ready: 'False', synced: 'True' }),
      makeRow({ name: 'z', namespace: 'alpha', ready: 'False', synced: 'True' }),
    ];
    const result = sortByReady(rows);
    expect(result.map(r => r.name)).toEqual(['z', 'a', 'b']);
  });

  test('within the ready group, rows sort by namespace then name', () => {
    const rows = [
      makeRow({ name: 'b', namespace: 'beta' }),
      makeRow({ name: 'a', namespace: 'beta' }),
      makeRow({ name: 'z', namespace: 'alpha' }),
    ];
    const result = sortByReady(rows);
    expect(result.map(r => r.name)).toEqual(['z', 'a', 'b']);
  });

  test('returns empty array for empty input', () => {
    expect(sortByReady([])).toEqual([]);
  });

  test('handles all rows ready', () => {
    const rows = [makeRow({ name: 'b' }), makeRow({ name: 'a' })];
    const result = sortByReady(rows);
    expect(result.map(r => r.name)).toEqual(['a', 'b']);
  });

  test('handles all rows not-ready', () => {
    const rows = [
      makeRow({ name: 'b', ready: 'False', synced: 'True' }),
      makeRow({ name: 'a', ready: 'False', synced: 'True' }),
    ];
    const result = sortByReady(rows);
    expect(result.map(r => r.name)).toEqual(['a', 'b']);
  });
});
