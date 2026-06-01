import { describe, expect, test } from 'vitest';
import { collectNotReady, countReady, NotReadyEntry, resolveDetailRoute } from './overview.utils';

function makeResource(name: string, conditions: Array<{ type: string; status: string; reason?: string; message?: string }>) {
  return {
    metadata: { name },
    jsonData: { status: { conditions } },
  };
}

// ── countReady ────────────────────────────────────────────────────────────────

describe('countReady', () => {
  test('returns null when resources is null', () => {
    expect(countReady(null, 'Ready')).toBeNull();
  });

  test('returns 0 for empty array', () => {
    expect(countReady([], 'Ready')).toBe(0);
  });

  test('counts only resources with the condition set to True', () => {
    const resources = [
      makeResource('a', [{ type: 'Healthy', status: 'True' }]),
      makeResource('b', [{ type: 'Healthy', status: 'False' }]),
      makeResource('c', [{ type: 'Healthy', status: 'True' }]),
      makeResource('d', []),
    ];
    expect(countReady(resources, 'Healthy')).toBe(2);
  });

  test('returns 0 when no resources have the condition', () => {
    const resources = [
      makeResource('a', [{ type: 'Installed', status: 'True' }]),
    ];
    expect(countReady(resources, 'Healthy')).toBe(0);
  });

  test('counts all when all resources have the condition True', () => {
    const resources = [
      makeResource('a', [{ type: 'Established', status: 'True' }]),
      makeResource('b', [{ type: 'Established', status: 'True' }]),
    ];
    expect(countReady(resources, 'Established')).toBe(2);
  });
});

// ── resolveDetailRoute ────────────────────────────────────────────────────────

describe('resolveDetailRoute', () => {
  function makeEntry(kind: string, name: string, detailRoute?: NotReadyEntry['detailRoute']): NotReadyEntry {
    return { kind, name, conditionType: 'Ready', reason: 'NotReady', message: '', detailRoute };
  }

  test('returns the explicit detailRoute when provided', () => {
    const route = { routeName: 'custom-route', params: { name: 'foo', extra: 'bar' } };
    expect(resolveDetailRoute(makeEntry('SomeKind', 'foo', route))).toEqual(route);
  });

  test('returns provider route for Provider kind', () => {
    expect(resolveDetailRoute(makeEntry('Provider', 'my-provider'))).toEqual({
      routeName: 'crossplane-provider-detail',
      params: { name: 'my-provider' },
    });
  });

  test('returns configuration route for Configuration kind', () => {
    expect(resolveDetailRoute(makeEntry('Configuration', 'my-config'))).toEqual({
      routeName: 'crossplane-configuration-detail',
      params: { name: 'my-config' },
    });
  });

  test('returns xrd route for CompositeResourceDefinition kind', () => {
    expect(resolveDetailRoute(makeEntry('CompositeResourceDefinition', 'my-xrd'))).toEqual({
      routeName: 'crossplane-xrd-detail',
      params: { name: 'my-xrd' },
    });
  });

  test('returns composition route for Composition kind', () => {
    expect(resolveDetailRoute(makeEntry('Composition', 'my-comp'))).toEqual({
      routeName: 'crossplane-composition-detail',
      params: { name: 'my-comp' },
    });
  });

  test('returns null for unknown kinds', () => {
    expect(resolveDetailRoute(makeEntry('ManagedResource', 'my-mr'))).toBeNull();
  });
});

// ── collectNotReady ───────────────────────────────────────────────────────────

describe('collectNotReady', () => {
  test('returns empty array for null resources', () => {
    expect(collectNotReady(null, 'Provider', ['Healthy'])).toEqual([]);
  });

  test('returns empty array for empty resources', () => {
    expect(collectNotReady([], 'Provider', ['Healthy'])).toEqual([]);
  });

  test('excludes resources where all watched conditions are True', () => {
    const resources = [
      makeResource('a', [
        { type: 'Installed', status: 'True' },
        { type: 'Healthy', status: 'True' },
      ]),
    ];
    expect(collectNotReady(resources, 'Provider', ['Installed', 'Healthy'])).toEqual([]);
  });

  test('includes resource when a watched condition is missing', () => {
    const resources = [makeResource('a', [])];
    const result = collectNotReady(resources, 'Provider', ['Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: 'Provider',
      name: 'a',
      conditionType: 'Healthy',
      reason: 'Unknown',
      message: 'No message reported',
    });
  });

  test('includes resource when a watched condition is False, with reason and message', () => {
    const resources = [
      makeResource('my-provider', [
        { type: 'Healthy', status: 'False', reason: 'PackageRevisionHealth', message: 'dependency not found' },
      ]),
    ];
    const result = collectNotReady(resources, 'Provider', ['Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: 'Provider',
      name: 'my-provider',
      conditionType: 'Healthy',
      reason: 'PackageRevisionHealth',
      message: 'dependency not found',
    });
  });

  test('breaks on first failing condition — does not add an entry per condition', () => {
    const resources = [
      makeResource('a', [{ type: 'Installed', status: 'False', reason: 'R1', message: 'M1' }]),
    ];
    // Both Installed and Healthy are watched but only one entry should appear
    const result = collectNotReady(resources, 'Provider', ['Installed', 'Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0].conditionType).toBe('Installed');
  });

  test('proceeds to next condition when the first is True', () => {
    const resources = [
      makeResource('a', [{ type: 'Installed', status: 'True' }]),
      // Healthy is missing so the resource is not-ready
    ];
    const result = collectNotReady(resources, 'Provider', ['Installed', 'Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0].conditionType).toBe('Healthy');
  });

  test('handles multiple resources, collecting each not-ready one', () => {
    const resources = [
      makeResource('ready', [
        { type: 'Installed', status: 'True' },
        { type: 'Healthy', status: 'True' },
      ]),
      makeResource('not-ready', [
        { type: 'Installed', status: 'True' },
        { type: 'Healthy', status: 'False', reason: 'Unhealthy', message: 'pod crash' },
      ]),
    ];
    const result = collectNotReady(resources, 'Provider', ['Installed', 'Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('not-ready');
  });

  test('handles resources without jsonData.status (falls back to empty conditions)', () => {
    const resources = [{ metadata: { name: 'bare' }, jsonData: {} }];
    const result = collectNotReady(resources, 'Provider', ['Healthy']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('bare');
  });

  test('uses "No message reported" fallback when condition message is an empty string', () => {
    const resources = [
      makeResource('a', [{ type: 'Ready', status: 'False', reason: 'SomeReason', message: '' }]),
    ];
    const result = collectNotReady(resources, 'Composition', ['Ready']);
    expect(result[0].message).toBe('No message reported');
  });

  test('skipIfMissing: skips resources where the condition does not exist', () => {
    const resources = [makeResource('no-cond', [])];
    expect(collectNotReady(resources, 'Composition', ['Ready'], { skipIfMissing: true })).toHaveLength(0);
  });

  test('skipIfMissing: still includes resources where condition exists but is False', () => {
    const resources = [
      makeResource('failing', [{ type: 'Ready', status: 'False', reason: 'ReconcileError', message: 'something broke' }]),
    ];
    const result = collectNotReady(resources, 'Composition', ['Ready'], { skipIfMissing: true });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('failing');
  });
});
