import { describe, expect, test } from 'vitest';
import { buildNotReadyInstances, debugMessage, isReady, sortByReady } from './Detail.utils';

function makeItem(name: string, conditions: any[], namespace?: string) {
  return { metadata: { name, ...(namespace ? { namespace } : {}) }, status: { conditions } };
}

// ── isReady ───────────────────────────────────────────────────────────────────

describe('isReady', () => {
  test('returns true when Ready condition is True', () => {
    expect(isReady([{ type: 'Ready', status: 'True' }])).toBe(true);
  });

  test('returns false when Ready condition is False', () => {
    expect(isReady([{ type: 'Ready', status: 'False' }])).toBe(false);
  });

  test('returns false when Ready condition is missing', () => {
    expect(isReady([])).toBe(false);
  });

  test('returns false for null/undefined conditions', () => {
    expect(isReady(null as any)).toBe(false);
  });
});

// ── debugMessage ──────────────────────────────────────────────────────────────

describe('debugMessage', () => {
  test('returns Synced message when Synced is not True', () => {
    const conds = [
      { type: 'Synced', status: 'False', message: 'pipeline error' },
      { type: 'Ready', status: 'False', message: 'not provisioned' },
    ];
    expect(debugMessage(conds)).toBe('pipeline error');
  });

  test('returns Ready message when Synced is True but Ready is not', () => {
    const conds = [
      { type: 'Synced', status: 'True' },
      { type: 'Ready', status: 'False', message: 'still provisioning' },
    ];
    expect(debugMessage(conds)).toBe('still provisioning');
  });

  test('returns null when all conditions are True', () => {
    const conds = [
      { type: 'Synced', status: 'True' },
      { type: 'Ready', status: 'True' },
    ];
    expect(debugMessage(conds)).toBeNull();
  });

  test('returns null when conditions is empty', () => {
    expect(debugMessage([])).toBeNull();
  });

  test('returns null when failing condition has no message', () => {
    expect(debugMessage([{ type: 'Synced', status: 'False' }])).toBeNull();
  });
});

// ── sortByReady ───────────────────────────────────────────────────────────────

describe('sortByReady', () => {
  test('not-ready items sort before ready items', () => {
    const items = [
      makeItem('ready', [{ type: 'Ready', status: 'True' }]),
      makeItem('not-ready', [{ type: 'Ready', status: 'False' }]),
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

  test('excludes ready instances', () => {
    const xrs = [makeItem('db1', [{ type: 'Ready', status: 'True' }])];
    expect(buildNotReadyInstances(xrs, null, 'XDatabase', 'Database')).toEqual([]);
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
