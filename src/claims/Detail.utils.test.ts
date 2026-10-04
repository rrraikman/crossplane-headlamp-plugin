import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDiscoveryCache } from '../discovery';
import { fetchFailingManagedResource, fetchXRData, resolveXRPlural } from './Detail.utils';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn(),
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
const mockRequest = vi.mocked(request);

beforeEach(() => {
  clearDiscoveryCache();
});

// ── resolveXRPlural ───────────────────────────────────────────────────────────

describe('resolveXRPlural', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('returns plural from discovery when found', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] });
    expect(await resolveXRPlural({ apiVersion: 'example.io/v1', kind: 'XDatabase' })).toBe('xdatabases');
  });

  test('falls back to kind.toLowerCase() + s when not found in discovery', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [] });
    expect(await resolveXRPlural({ apiVersion: 'example.io/v1', kind: 'XDatabase' })).toBe('xdatabases');
  });

  test('falls back to kind.toLowerCase() + s when request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));
    expect(await resolveXRPlural({ apiVersion: 'example.io/v1', kind: 'XDatabase' })).toBe('xdatabases');
  });

  test('skips subresource entries (containing slash)', async () => {
    mockRequest.mockResolvedValueOnce({
      resources: [
        { kind: 'XDatabase', name: 'xdatabases/status' },
        { kind: 'XDatabase', name: 'xdatabases' },
      ],
    });
    expect(await resolveXRPlural({ apiVersion: 'example.io/v1', kind: 'XDatabase' })).toBe('xdatabases');
  });

  test('returns empty string fallback when xrRef is null', async () => {
    expect(await resolveXRPlural(null)).toBe('s');
  });

  test('returns kind fallback when apiVersion is missing', async () => {
    expect(await resolveXRPlural({ kind: 'XDatabase' })).toBe('xdatabases');
  });
});

// ── fetchXRData ───────────────────────────────────────────────────────────────

describe('fetchXRData', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('returns null when resourceRef is missing fields', async () => {
    expect(await fetchXRData(null)).toBeNull();
    expect(await fetchXRData({ kind: 'XDatabase' })).toBeNull();
  });

  test('returns resourceRefs and conditions from the found XR', async () => {
    const resourceRefs = [{ apiVersion: 'aws.io/v1', kind: 'RDSInstance', name: 'my-rds' }];
    const conditions = [{ type: 'Ready', status: 'False', message: 'creating' }];
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] })
      .mockResolvedValueOnce({
        items: [{ metadata: { name: 'my-db' }, spec: { resourceRefs }, status: { conditions } }],
      });

    const result = await fetchXRData({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' });
    expect(result).toEqual({ resourceRefs, conditions });
  });

  test('returns null when request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));
    expect(await fetchXRData({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' })).toBeNull();
  });
});

// ── fetchFailingManagedResource ───────────────────────────────────────────────

describe('fetchFailingManagedResource', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('returns null when resourceRefs is empty', async () => {
    expect(await fetchFailingManagedResource([])).toBeNull();
  });

  test('returns null when resourceRefs is null', async () => {
    expect(await fetchFailingManagedResource(null as any)).toBeNull();
  });

  test('returns null when all MRs have passing conditions', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'RDSInstance', name: 'rdsinstances' }] })
      .mockResolvedValueOnce({
        status: { conditions: [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'True' }] },
      });

    const result = await fetchFailingManagedResource([
      { apiVersion: 'aws.io/v1beta1', kind: 'RDSInstance', name: 'my-rds' },
    ]);
    expect(result).toBeNull();
  });

  test('returns FailingResource for the first MR with a failing condition', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'RDSInstance', name: 'rdsinstances' }] })
      .mockResolvedValueOnce({
        status: { conditions: [{ type: 'Synced', status: 'False', reason: 'ReconcileError' }] },
      });

    const result = await fetchFailingManagedResource([
      { apiVersion: 'aws.io/v1beta1', kind: 'RDSInstance', name: 'my-rds' },
    ]);
    expect(result).toEqual({
      kind: 'RDSInstance',
      name: 'my-rds',
      routeParams: { group: 'aws.io', version: 'v1beta1', plural: 'rdsinstances', name: 'my-rds' },
    });
  });

  test('skips ref with missing apiVersion and returns null', async () => {
    const result = await fetchFailingManagedResource([{ kind: 'RDSInstance', name: 'my-rds' }]);
    expect(result).toBeNull();
  });

  test('falls back to kind.toLowerCase() + s when discovery has no match', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [] })
      .mockResolvedValueOnce({
        status: { conditions: [{ type: 'Ready', status: 'False' }] },
      });

    const result = await fetchFailingManagedResource([
      { apiVersion: 'aws.io/v1beta1', kind: 'RDSInstance', name: 'my-rds' },
    ]);
    expect(result?.routeParams.plural).toBe('rdsinstances');
  });

  test('returns null when MR has no conditions', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'RDSInstance', name: 'rdsinstances' }] })
      .mockResolvedValueOnce({ status: {} });

    expect(
      await fetchFailingManagedResource([
        { apiVersion: 'aws.io/v1beta1', kind: 'RDSInstance', name: 'my-rds' },
      ])
    ).toBeNull();
  });

  test('fetches namespaced composed resources from the owner namespace and links with it', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'Stack', name: 'stacks', namespaced: true }] })
      .mockResolvedValueOnce({
        metadata: { name: 'ingress', namespace: 'prod' },
        status: { conditions: [{ type: 'Synced', status: 'False' }] },
      });

    const result = await fetchFailingManagedResource(
      [{ apiVersion: 'cf.aws.m.upbound.io/v1beta1', kind: 'Stack', name: 'ingress' }],
      'prod'
    );
    expect(mockRequest).toHaveBeenLastCalledWith('/apis/cf.aws.m.upbound.io/v1beta1/namespaces/prod/stacks/ingress');
    expect(result?.routeParams).toEqual({
      group: 'cf.aws.m.upbound.io',
      version: 'v1beta1',
      plural: 'stacks',
      name: 'ingress',
      namespace: 'prod',
    });
  });
});
