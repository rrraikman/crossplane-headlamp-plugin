import { describe, expect, test } from 'vitest';
import { buildNotReadyInstances, sortByReady } from './Detail.utils';

function makeItem(name: string, conditions: any[], namespace?: string) {
  return { metadata: { name, ...(namespace ? { namespace } : {}) }, status: { conditions } };
}

// ── sortByReady ───────────────────────────────────────────────────────────────

describe('sortByReady', () => {
  test('not-ready items sort before ready items', () => {
    const items = [
      makeItem('ready', [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'True' }]),
      makeItem('not-ready', [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'False' }]),
    ];
    expect(sortByReady(items)[0].metadata.name).toBe('not-ready');
  });

  test('returns a new array without mutating the original', () => {
    const items = [makeItem('a', [])];
    expect(sortByReady(items)).not.toBe(items);
  });

  test('returns empty array for empty input', () => {
    expect(sortByReady([])).toEqual([]);
  });
});

// ── buildNotReadyInstances ────────────────────────────────────────────────────

describe('buildNotReadyInstances', () => {
  test('returns empty array when both xrs and claims are null', () => {
    expect(buildNotReadyInstances(null, null, 'XDatabase', 'Database')).toEqual([]);
  });

  test('excludes ready and synced instances', () => {
    const xrs = [makeItem('db1', [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'True' }])];
    expect(buildNotReadyInstances(xrs, null, 'XDatabase', 'Database')).toEqual([]);
  });

  test('includes instances that are Ready but not Synced, matching the overview', () => {
    const xrs = [
      makeItem('db1', [
        { type: 'Ready', status: 'True' },
        { type: 'Synced', status: 'False', reason: 'ReconcileError', message: 'cannot compose' },
      ]),
    ];
    expect(buildNotReadyInstances(xrs, null, 'XDatabase', 'Database')[0]).toMatchObject({
      reason: 'ReconcileError',
      message: 'cannot compose',
    });
  });

  test('reports the namespace of namespaced XRs', () => {
    const xrs = [makeItem('web', [{ type: 'Ready', status: 'False' }], 'prod')];
    expect(buildNotReadyInstances(xrs, null, 'WebService', 'Claim')[0].namespace).toBe('prod');
  });

  test('includes not-ready XRs with correct fields', () => {
    const xrs = [
      makeItem('db1', [
        { type: 'Ready', status: 'False', reason: 'NotFound', message: 'missing resource' },
      ]),
    ];
    const result = buildNotReadyInstances(xrs, null, 'XDatabase', 'Database');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      instanceKind: 'XDatabase',
      name: 'db1',
      namespace: '—',
      reason: 'NotFound',
      message: 'missing resource',
    });
  });

  test('includes not-ready claims with namespace', () => {
    const claims = [
      makeItem('my-claim', [{ type: 'Ready', status: 'False', reason: 'Pending' }], 'dev'),
    ];
    const result = buildNotReadyInstances(null, claims, 'XDatabase', 'Database');
    expect(result[0]).toMatchObject({
      instanceKind: 'Database',
      name: 'my-claim',
      namespace: 'dev',
      reason: 'Pending',
    });
  });

  test('collects from both xrs and claims', () => {
    const xrs = [makeItem('xr1', [{ type: 'Ready', status: 'False' }])];
    const claims = [makeItem('c1', [{ type: 'Ready', status: 'False' }], 'ns')];
    expect(buildNotReadyInstances(xrs, claims, 'XDatabase', 'Database')).toHaveLength(2);
  });

  test('defaults reason to Unknown and message to No message reported when missing', () => {
    const xrs = [makeItem('xr1', [{ type: 'Ready', status: 'False' }])];
    const result = buildNotReadyInstances(xrs, null, 'XDatabase', 'Database');
    expect(result[0].reason).toBe('Unknown');
    expect(result[0].message).toBe('No message reported');
  });
});
