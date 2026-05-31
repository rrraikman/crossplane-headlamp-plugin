import { describe, expect, test } from 'vitest';
import { sortByReady,XRRow } from './List.utils';

function makeRow(overrides: Partial<XRRow> & { name: string }): XRRow {
  return {
    kind: 'XDatabase',
    group: 'example.io',
    version: 'v1',
    plural: 'xdatabases',
    ready: 'True',
    synced: 'True',
    creationTimestamp: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('sortByReady', () => {
  test('returns a new array without mutating the original', () => {
    const rows = [makeRow({ name: 'a' })];
    expect(sortByReady(rows)).not.toBe(rows);
  });

  test('not-ready rows sort before ready rows', () => {
    const rows = [
      makeRow({ name: 'ready', ready: 'True', synced: 'True' }),
      makeRow({ name: 'not-ready', ready: 'False', synced: 'True' }),
    ];
    expect(sortByReady(rows)[0].name).toBe('not-ready');
  });

  test('a row with synced False is treated as not-ready', () => {
    const rows = [
      makeRow({ name: 'ready' }),
      makeRow({ name: 'unsynced', synced: 'False' }),
    ];
    expect(sortByReady(rows)[0].name).toBe('unsynced');
  });

  test('within a group, rows sort by name alphabetically', () => {
    const rows = [
      makeRow({ name: 'c', ready: 'False', synced: 'True' }),
      makeRow({ name: 'a', ready: 'False', synced: 'True' }),
      makeRow({ name: 'b', ready: 'False', synced: 'True' }),
    ];
    expect(sortByReady(rows).map(r => r.name)).toEqual(['a', 'b', 'c']);
  });

  test('returns empty array for empty input', () => {
    expect(sortByReady([])).toEqual([]);
  });
});
