import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  apiGroupPath,
  clearDiscoveryCache,
  detailRouteParams,
  discoverResource,
  parseApiVersion,
  resourcePath,
} from './discovery';

const mockRequest = vi.mocked(request);

describe('parseApiVersion', () => {
  test('splits group and version', () => {
    expect(parseApiVersion('s3.aws.io/v1beta1')).toEqual({ group: 's3.aws.io', version: 'v1beta1' });
  });

  test('returns an empty group for core apiVersions', () => {
    expect(parseApiVersion('v1')).toEqual({ group: '', version: 'v1' });
  });
});

describe('apiGroupPath', () => {
  test('uses /apis for grouped apiVersions', () => {
    expect(apiGroupPath('apps/v1')).toBe('/apis/apps/v1');
  });

  test('uses /api for core apiVersions', () => {
    expect(apiGroupPath('v1')).toBe('/api/v1');
  });
});

describe('resourcePath', () => {
  test('builds a cluster-wide list path', () => {
    expect(resourcePath('apps/v1', 'deployments')).toBe('/apis/apps/v1/deployments');
  });

  test('builds a namespaced item path', () => {
    expect(resourcePath('v1', 'services', { namespace: 'prod', name: 'web' })).toBe(
      '/api/v1/namespaces/prod/services/web'
    );
  });
});

describe('detailRouteParams', () => {
  test('includes the namespace for namespaced resources', () => {
    expect(detailRouteParams('ex.io/v1', 'xdbs', 'db', 'prod')).toEqual({
      group: 'ex.io',
      version: 'v1',
      plural: 'xdbs',
      name: 'db',
      namespace: 'prod',
    });
  });

  test('omits the namespace key for cluster-scoped resources', () => {
    expect(detailRouteParams('ex.io/v1', 'xdbs', 'db', '')).not.toHaveProperty('namespace');
    expect(detailRouteParams('ex.io/v1', 'xdbs', 'db')).not.toHaveProperty('namespace');
  });
});

describe('discoverResource', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    clearDiscoveryCache();
  });

  test('returns plural and scope from discovery, skipping subresources', async () => {
    mockRequest.mockResolvedValueOnce({
      resources: [
        { kind: 'Bucket', name: 'buckets/status', namespaced: false },
        { kind: 'Bucket', name: 'buckets', namespaced: true },
      ],
    });
    expect(await discoverResource('s3.aws.io/v1beta1', 'Bucket')).toEqual({
      plural: 'buckets',
      namespaced: true,
    });
    expect(mockRequest).toHaveBeenCalledWith('/apis/s3.aws.io/v1beta1');
  });

  test('queries /api/<version> for core kinds', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'Pod', name: 'pods', namespaced: true }] });
    await discoverResource('v1', 'Pod');
    expect(mockRequest).toHaveBeenCalledWith('/api/v1');
  });

  test('falls back to a guessed plural with unknown scope when the kind is not found', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [] });
    expect(await discoverResource('other.io/v1', 'RDSInstance')).toEqual({
      plural: 'rdsinstances',
      namespaced: undefined,
    });
  });

  test('falls back when discovery throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));
    expect((await discoverResource('failing.io/v1', 'Widget')).plural).toBe('widgets');
  });

  test('caches successful lookups', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'Queue', name: 'queues', namespaced: true }] });
    await discoverResource('sqs.io/v1', 'Queue');
    await discoverResource('sqs.io/v1', 'Queue');
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test('does not cache fallbacks, so a later lookup can succeed', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [] })
      .mockResolvedValueOnce({ resources: [{ kind: 'Late', name: 'lates', namespaced: false }] });
    expect((await discoverResource('late.io/v1', 'Late')).namespaced).toBeUndefined();
    expect((await discoverResource('late.io/v1', 'Late')).namespaced).toBe(false);
  });
});
