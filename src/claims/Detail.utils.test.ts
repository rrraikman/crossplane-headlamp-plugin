import { beforeEach, describe, expect, test, vi } from 'vitest';
import { claimStatusLabel, fetchXRResourceRefs } from './Detail.utils';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn(),
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
const mockRequest = vi.mocked(request);

// ── claimStatusLabel ──────────────────────────────────────────────────────────

describe('claimStatusLabel', () => {
  test('returns Ready when both ready and synced are True', () => {
    expect(claimStatusLabel('True', 'True')).toBe('Ready');
  });

  test('returns Sync Failed when synced is not True', () => {
    expect(claimStatusLabel('True', 'False')).toBe('Sync Failed');
    expect(claimStatusLabel('True', 'Unknown')).toBe('Sync Failed');
  });

  test('returns Not Ready when synced is True but ready is not', () => {
    expect(claimStatusLabel('False', 'True')).toBe('Not Ready');
    expect(claimStatusLabel('Unknown', 'True')).toBe('Not Ready');
  });

  test('Sync Failed takes priority over Not Ready when both are false', () => {
    expect(claimStatusLabel('False', 'False')).toBe('Sync Failed');
  });
});

// ── fetchXRResourceRefs ───────────────────────────────────────────────────────

describe('fetchXRResourceRefs', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('returns null when resourceRef is null', async () => {
    expect(await fetchXRResourceRefs(null)).toBeNull();
  });

  test('returns null when apiVersion is missing', async () => {
    expect(await fetchXRResourceRefs({ kind: 'XDatabase', name: 'my-db' })).toBeNull();
  });

  test('returns null when kind is missing', async () => {
    expect(await fetchXRResourceRefs({ apiVersion: 'example.io/v1', name: 'my-db' })).toBeNull();
  });

  test('returns null when name is missing', async () => {
    expect(await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase' })).toBeNull();
  });

  test('returns resourceRefs from the found XR (v1 spec layout)', async () => {
    const resourceRefs = [{ apiVersion: 'aws.io/v1', kind: 'RDSInstance', name: 'my-rds' }];
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'my-db' }, spec: { resourceRefs } }] });

    const result = await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' });
    expect(result).toEqual(resourceRefs);
    expect(mockRequest).toHaveBeenNthCalledWith(1, '/apis/example.io/v1');
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/apis/example.io/v1/xdatabases');
  });

  test('returns resourceRefs from the found XR (v2 spec.crossplane layout)', async () => {
    const resourceRefs = [{ apiVersion: 'aws.io/v1', kind: 'RDSInstance', name: 'my-rds' }];
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] })
      .mockResolvedValueOnce({
        items: [{ metadata: { name: 'my-db' }, spec: { crossplane: { resourceRefs } } }],
      });

    const result = await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' });
    expect(result).toEqual(resourceRefs);
  });

  test('falls back to kind.toLowerCase() + s for plural when discovery has no match', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [] })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'my-db' }, spec: { resourceRefs: [] } }] });

    await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' });
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/apis/example.io/v1/xdatabases');
  });

  test('skips discovery resources that include a slash (subresources)', async () => {
    mockRequest
      .mockResolvedValueOnce({
        resources: [
          { kind: 'XDatabase', name: 'xdatabases/status' },
          { kind: 'XDatabase', name: 'xdatabases' },
        ],
      })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'my-db' }, spec: { resourceRefs: [] } }] });

    await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' });
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/apis/example.io/v1/xdatabases');
  });

  test('returns null when the named XR is not in the list', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'other-db' }, spec: { resourceRefs: [] } }] });

    expect(await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' })).toBeNull();
  });

  test('returns null when request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));
    expect(await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' })).toBeNull();
  });

  test('returns empty array when XR has no resourceRefs', async () => {
    mockRequest
      .mockResolvedValueOnce({ resources: [{ kind: 'XDatabase', name: 'xdatabases' }] })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'my-db' }, spec: {} }] });

    expect(await fetchXRResourceRefs({ apiVersion: 'example.io/v1', kind: 'XDatabase', name: 'my-db' })).toEqual([]);
  });
});
