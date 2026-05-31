import { describe, expect, test } from 'vitest';
import { crdToMRType, typeKey } from './List.utils';

// ── crdToMRType ───────────────────────────────────────────────────────────────

describe('crdToMRType', () => {
  test('picks the storage version', () => {
    const crd = {
      spec: {
        group: 'example.io',
        names: { kind: 'Widget', plural: 'widgets' },
        versions: [
          { name: 'v1alpha1', storage: false },
          { name: 'v1', storage: true },
        ],
      },
    };
    expect(crdToMRType(crd)).toEqual({
      kind: 'Widget',
      group: 'example.io',
      version: 'v1',
      plural: 'widgets',
    });
  });

  test('falls back to first version when none is marked storage', () => {
    const crd = {
      spec: {
        group: 'example.io',
        names: { kind: 'Widget', plural: 'widgets' },
        versions: [
          { name: 'v1beta1', storage: false },
          { name: 'v1', storage: false },
        ],
      },
    };
    const result = crdToMRType(crd);
    expect(result.version).toBe('v1beta1');
  });

  test('falls back to "v1" when versions array is absent', () => {
    const crd = {
      spec: {
        group: 'example.io',
        names: { kind: 'Widget', plural: 'widgets' },
      },
    };
    const result = crdToMRType(crd);
    expect(result.version).toBe('v1');
  });

  test('maps kind, group, and plural correctly', () => {
    const crd = {
      spec: {
        group: 'aws.crossplane.io',
        names: { kind: 'Bucket', plural: 'buckets' },
        versions: [{ name: 'v1alpha1', storage: true }],
      },
    };
    const result = crdToMRType(crd);
    expect(result.kind).toBe('Bucket');
    expect(result.group).toBe('aws.crossplane.io');
    expect(result.plural).toBe('buckets');
  });
});

// ── typeKey ───────────────────────────────────────────────────────────────────

describe('typeKey', () => {
  test('returns group/plural', () => {
    expect(typeKey({ kind: 'Bucket', group: 'aws.crossplane.io', version: 'v1alpha1', plural: 'buckets' }))
      .toBe('aws.crossplane.io/buckets');
  });

  test('works with different group and plural values', () => {
    expect(typeKey({ kind: 'RDSInstance', group: 'database.aws.crossplane.io', version: 'v1beta1', plural: 'rdsinstances' }))
      .toBe('database.aws.crossplane.io/rdsinstances');
  });
});
