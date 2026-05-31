import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { debugMessage, resolvePlural } from './ManagedResources.utils';

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

// ── resolvePlural ─────────────────────────────────────────────────────────────

describe('resolvePlural', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('returns plural from discovery when a matching resource is found', async () => {
    mockRequest.mockResolvedValueOnce({
      resources: [
        { kind: 'Bucket', name: 'buckets' },
        { kind: 'Bucket', name: 'buckets/status' },
      ],
    });
    const result = await resolvePlural('s3.aws.crossplane.io/v1beta1', 'Bucket');
    expect(result).toBe('buckets');
    expect(mockRequest).toHaveBeenCalledWith('/apis/s3.aws.crossplane.io/v1beta1');
  });

  test('skips subresources containing a slash when matching', async () => {
    mockRequest.mockResolvedValueOnce({
      resources: [
        { kind: 'Table', name: 'tables/status' },
        { kind: 'Table', name: 'tables' },
      ],
    });
    const result = await resolvePlural('dynamo.aws.crossplane.io/v1alpha1', 'Table');
    expect(result).toBe('tables');
  });

  test('falls back to kind.toLowerCase()+"s" when discovery has no match', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [] });
    const result = await resolvePlural('other.io/v1alpha2', 'RDSInstance');
    expect(result).toBe('rdsinstances');
  });

  test('falls back to kind.toLowerCase()+"s" when request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));
    const result = await resolvePlural('failing.io/v1', 'Widget');
    expect(result).toBe('widgets');
  });

  test('uses /apis/group/version path for versioned apiVersions', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'Repo', name: 'repos' }] });
    await resolvePlural('git.io/v1', 'Repo');
    expect(mockRequest).toHaveBeenCalledWith('/apis/git.io/v1');
  });

  test('uses /api/version path for core API (no slash in apiVersion)', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'Pod', name: 'pods' }] });
    await resolvePlural('v1', 'Pod');
    expect(mockRequest).toHaveBeenCalledWith('/api/v1');
  });

  test('returns cached result on second call with same apiVersion+kind', async () => {
    mockRequest.mockResolvedValueOnce({ resources: [{ kind: 'Queue', name: 'queues' }] });
    const first = await resolvePlural('sqs.unique.io/v1', 'Queue');
    const second = await resolvePlural('sqs.unique.io/v1', 'Queue');
    expect(first).toBe('queues');
    expect(second).toBe('queues');
    // Only one network call — second was served from cache
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
