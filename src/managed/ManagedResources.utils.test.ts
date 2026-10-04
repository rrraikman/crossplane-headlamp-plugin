import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { clearDiscoveryCache } from '../discovery';
import { debugMessage, fetchReferencedResources, refMatches, scopeRefs } from './ManagedResources.utils';

const mockRequest = vi.mocked(request);

// ── debugMessage ──────────────────────────────────────────────────────────────

describe('debugMessage', () => {
  test('returns Synced message when Synced is not True and has a message', () => {
    const conditions = [
      { type: 'Synced', status: 'False', message: 'provider config missing' },
      { type: 'Ready', status: 'True', message: '' },
    ];
    expect(debugMessage(conditions)).toBe('provider config missing');
  });

  test('returns Ready message when Ready is not True and has a message (Synced is True)', () => {
    const conditions = [
      { type: 'Synced', status: 'True', message: '' },
      { type: 'Ready', status: 'False', message: 'resource not found' },
    ];
    expect(debugMessage(conditions)).toBe('resource not found');
  });

  test('Synced message takes priority over Ready message', () => {
    const conditions = [
      { type: 'Synced', status: 'False', message: 'sync error' },
      { type: 'Ready', status: 'False', message: 'ready error' },
    ];
    expect(debugMessage(conditions)).toBe('sync error');
  });

  test('returns null when all conditions are True', () => {
    const conditions = [
      { type: 'Synced', status: 'True', message: '' },
      { type: 'Ready', status: 'True', message: '' },
    ];
    expect(debugMessage(conditions)).toBeNull();
  });

  test('returns null when conditions array is empty', () => {
    expect(debugMessage([])).toBeNull();
  });

  test('returns null when conditions is null/undefined', () => {
    expect(debugMessage(null as any)).toBeNull();
  });

  test('returns null when Synced is not True but has no message', () => {
    const conditions = [
      { type: 'Synced', status: 'False', message: '' },
      { type: 'Ready', status: 'True', message: '' },
    ];
    expect(debugMessage(conditions)).toBeNull();
  });
});

// ── scopeRefs ────────────────────────────────────────────────────────────────

describe('scopeRefs', () => {
  test('assigns the owner namespace to refs without one', () => {
    const refs = [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'web' }];
    expect(scopeRefs(refs, 'prod')).toEqual([{ ...refs[0], namespace: 'prod' }]);
  });

  test('keeps an explicit ref namespace over the owner namespace', () => {
    const refs = [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'web', namespace: 'other' }];
    expect(scopeRefs(refs, 'prod')[0].namespace).toBe('other');
  });

  test('drops refs missing apiVersion, kind or name', () => {
    expect(scopeRefs([{ apiVersion: '', kind: 'X', name: 'a' }, null as any], 'prod')).toEqual([]);
  });

  test('returns an empty array for undefined refs', () => {
    expect(scopeRefs(undefined)).toEqual([]);
  });
});

// ── refMatches ───────────────────────────────────────────────────────────────

describe('refMatches', () => {
  const ref = { apiVersion: 'apps/v1', kind: 'Deployment', name: 'web', namespace: 'prod' };
  const item = (name: string, namespace?: string) => ({ metadata: { name, namespace } });

  test('matches same name and namespace', () => {
    expect(refMatches(ref, item('web', 'prod'), true)).toBe(true);
  });

  test('rejects a same-named resource in another namespace', () => {
    expect(refMatches(ref, item('web', 'staging'), true)).toBe(false);
  });

  test('rejects a different name', () => {
    expect(refMatches(ref, item('api', 'prod'), true)).toBe(false);
  });

  test('ignores namespace for cluster-scoped kinds', () => {
    expect(refMatches(ref, item('web', 'staging'), false)).toBe(true);
  });

  test('matches by name when the ref has no namespace', () => {
    expect(refMatches({ ...ref, namespace: undefined }, item('web', 'staging'), true)).toBe(true);
  });
});

// ── fetchReferencedResources ─────────────────────────────────────────────────

describe('fetchReferencedResources', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    clearDiscoveryCache();
  });

  test('lists namespaced kinds in the refs namespace and excludes other namespaces', async () => {
    mockRequest.mockImplementation((path: string) => {
      if (path === '/apis/apps/v1') {
        return Promise.resolve({ resources: [{ kind: 'Deployment', name: 'deployments', namespaced: true }] });
      }
      return Promise.resolve({
        items: [
          { metadata: { name: 'web', namespace: 'prod' } },
          { metadata: { name: 'web', namespace: 'staging' } },
        ],
      });
    });
    const items = await fetchReferencedResources([
      { apiVersion: 'apps/v1', kind: 'Deployment', name: 'web', namespace: 'prod' },
    ]);
    expect(mockRequest).toHaveBeenCalledWith('/apis/apps/v1/namespaces/prod/deployments');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      metadata: { namespace: 'prod' },
      __apiVersion: 'apps/v1',
      __kind: 'Deployment',
      __plural: 'deployments',
    });
  });

  test('lists cluster-scoped kinds without a namespace segment', async () => {
    mockRequest.mockImplementation((path: string) => {
      if (path === '/apis/s3.aws.io/v1beta1') {
        return Promise.resolve({ resources: [{ kind: 'Bucket', name: 'buckets', namespaced: false }] });
      }
      return Promise.resolve({ items: [{ metadata: { name: 'b' } }] });
    });
    const items = await fetchReferencedResources([
      { apiVersion: 's3.aws.io/v1beta1', kind: 'Bucket', name: 'b', namespace: 'prod' },
    ]);
    expect(mockRequest).toHaveBeenCalledWith('/apis/s3.aws.io/v1beta1/buckets');
    expect(items).toHaveLength(1);
  });

  test('uses the core /api path for groupless kinds', async () => {
    mockRequest.mockImplementation((path: string) => {
      if (path === '/api/v1') {
        return Promise.resolve({ resources: [{ kind: 'Service', name: 'services', namespaced: true }] });
      }
      return Promise.resolve({ items: [{ metadata: { name: 'web', namespace: 'prod' } }] });
    });
    await fetchReferencedResources([{ apiVersion: 'v1', kind: 'Service', name: 'web', namespace: 'prod' }]);
    expect(mockRequest).toHaveBeenCalledWith('/api/v1/namespaces/prod/services');
  });

  test('returns an empty list for a kind whose list request fails', async () => {
    mockRequest.mockImplementation((path: string) =>
      path === '/apis/x.io/v1' ? Promise.resolve({ resources: [] }) : Promise.reject(new Error('403'))
    );
    expect(await fetchReferencedResources([{ apiVersion: 'x.io/v1', kind: 'Thing', name: 't' }])).toEqual([]);
  });
});
