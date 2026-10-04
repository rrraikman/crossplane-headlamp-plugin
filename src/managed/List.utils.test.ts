import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  countInstances,
  crdToMRType,
  fetchManagedResourceCRDs,
  mapWithConcurrency,
  typeKey,
} from './List.utils';

const mockRequest = vi.mocked(request);
const bucket = { kind: 'Bucket', group: 's3.aws.io', version: 'v1beta1', plural: 'buckets' };

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

// ── fetchManagedResourceCRDs ─────────────────────────────────────────────────

describe('fetchManagedResourceCRDs', () => {
  beforeEach(() => mockRequest.mockReset());

  test('returns labelled CRDs without listing every CRD', async () => {
    mockRequest.mockResolvedValueOnce({ items: [{ spec: { names: { kind: 'Bucket' } } }] });
    expect(await fetchManagedResourceCRDs()).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest.mock.calls[0][0]).toContain('labelSelector=crossplane.io%2Fresource%3Dmanaged');
  });

  test('falls back to the managed category when no CRD carries the label', async () => {
    mockRequest.mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({
      items: [
        { spec: { names: { kind: 'Bucket', categories: ['crossplane', 'managed'] } } },
        { spec: { names: { kind: 'Thing', categories: [] } } },
      ],
    });
    const crds = await fetchManagedResourceCRDs();
    expect(crds.map(c => c.spec.names.kind)).toEqual(['Bucket']);
  });
});

// ── countInstances ───────────────────────────────────────────────────────────

describe('countInstances', () => {
  beforeEach(() => mockRequest.mockReset());

  test('adds remainingItemCount to the single-item page', async () => {
    mockRequest.mockResolvedValueOnce({ items: [{}], metadata: { continue: 'x', remainingItemCount: 41 } });
    expect(await countInstances(bucket)).toBe(42);
    expect(mockRequest).toHaveBeenCalledWith('/apis/s3.aws.io/v1beta1/buckets?limit=1');
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test('returns the page size when there is no continuation', async () => {
    mockRequest.mockResolvedValueOnce({ items: [], metadata: {} });
    expect(await countInstances(bucket)).toBe(0);
  });

  test('falls back to a full list when the server omits remainingItemCount', async () => {
    mockRequest
      .mockResolvedValueOnce({ items: [{}], metadata: { continue: 'x' } })
      .mockResolvedValueOnce({ items: [{}, {}, {}] });
    expect(await countInstances(bucket)).toBe(3);
    expect(mockRequest).toHaveBeenLastCalledWith('/apis/s3.aws.io/v1beta1/buckets');
  });
});

// ── mapWithConcurrency ───────────────────────────────────────────────────────

describe('mapWithConcurrency', () => {
  test('preserves input order in the results', async () => {
    const delays = [30, 0, 10];
    const result = await mapWithConcurrency(delays, 2, d => new Promise(r => setTimeout(() => r(d), d)));
    expect(result).toEqual([30, 0, 10]);
  });

  test('never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise(r => setTimeout(r, 1));
      running--;
    });
    expect(peak).toBe(3);
  });

  test('handles an empty input', async () => {
    expect(await mapWithConcurrency([], 4, async x => x)).toEqual([]);
  });
});
