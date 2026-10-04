import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerMapSource: vi.fn(),
}));

vi.mock('../hooks', () => ({
  makeKubeObject: (json: any) => ({ metadata: json.metadata, jsonData: json }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('@iconify/react', () => ({
  Icon: () => null,
}));

vi.mock('../resources', () => ({
  CompositeResourceDefinition: { useList: vi.fn().mockReturnValue([null, null]) },
  Composition: { useList: vi.fn().mockReturnValue([null, null]) },
}));

import { registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { CompositeResourceDefinition,Composition } from '../resources';
import { registerCrossplaneMapSource } from './mapSource';

// Register once; capture the useData hook the source was registered with.
registerCrossplaneMapSource();
const registeredSource = (vi.mocked(registerMapSource).mock.calls[0][0] as any);
const useData: () => any = registeredSource.useData;

function makeXRD(
  name: string,
  kind: string,
  plural: string,
  claimNames: { kind: string; plural: string } | null
) {
  return {
    metadata: { name },
    jsonData: {
      spec: {
        group: 'example.io',
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
        names: { kind, plural },
        claimNames: claimNames ?? undefined,
      },
    },
  };
}

describe('registerCrossplaneMapSource', () => {
  test('registers a source with id "crossplane"', () => {
    expect(registerMapSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'crossplane', label: 'Crossplane' })
    );
  });
});

describe('useCrossplaneGraphData', () => {
  beforeEach(() => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([null, null]);
    vi.mocked(request).mockResolvedValue({ items: [] });
  });

  test('returns null while both compositions and XR items are still loading', () => {
    const { result } = renderHook(() => useData());
    expect(result.current).toBeNull();
  });

  test('returns composition nodes immediately even when XRDs have not loaded yet', async () => {
    const comp = { metadata: { uid: 'comp-uid', name: 'my-composition' } };
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current).not.toBeNull());

    const node = result.current.nodes.find((n: any) => n.id === 'comp-uid');
    expect(node).toBeDefined();
    expect(result.current.edges).toHaveLength(0);
  });

  test('returns empty nodes and edges when cluster has no XRDs', async () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.nodes).toHaveLength(0);
    expect(result.current.edges).toHaveLength(0);
  });

  test('creates a node for each composition', async () => {
    const comp = { metadata: { uid: 'comp-uid', name: 'my-composition' } };
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current).not.toBeNull());

    const node = result.current.nodes.find((n: any) => n.id === 'comp-uid');
    expect(node).toBeDefined();
    expect(node.kubeObject).toBe(comp);
  });

  test('creates an XR node with status and a XR→composition edge', async () => {
    const xrd = makeXRD('xdatabases.example.io', 'XDatabase', 'xdatabases', null);
    const comp = { metadata: { uid: 'comp-uid', name: 'my-composition' } };
    const xrItem = {
      metadata: { uid: 'xr-uid', name: 'my-xr' },
      spec: { compositionRef: { name: 'my-composition' } },
      status: {
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'Synced', status: 'True' },
        ],
      },
    };

    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[xrd], null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);
    vi.mocked(request).mockResolvedValue({ items: [xrItem] });

    const { result } = renderHook(() => useData());
    await waitFor(() =>
      expect(result.current?.nodes.some((n: any) => n.id === 'xr-uid')).toBe(true)
    );

    const node = result.current.nodes.find((n: any) => n.id === 'xr-uid');
    expect(node.label).toBe('my-xr');
    expect(node.subtitle).toBe('XDatabase');
    expect(node.status).toBe('success');

    const edge = result.current.edges.find((e: any) => e.source === 'xr-uid');
    expect(edge?.target).toBe('comp-uid');
  });

  test('creates a claim node and a claim→XR edge', async () => {
    const xrd = makeXRD('databases.example.io', 'XDatabase', 'xdatabases', {
      kind: 'Database',
      plural: 'databases',
    });
    const xrItem = {
      metadata: { uid: 'xr-uid', name: 'my-xr' },
      spec: {},
      status: { conditions: [] },
    };
    const claimItem = {
      metadata: { uid: 'claim-uid', name: 'my-claim', namespace: 'default' },
      spec: { resourceRef: { apiVersion: 'example.io/v1alpha1', kind: 'XDatabase', name: 'my-xr' } },
      status: {
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'Synced', status: 'True' },
        ],
      },
    };

    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[xrd], null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    vi.mocked(request)
      .mockResolvedValueOnce({ items: [xrItem] })
      .mockResolvedValueOnce({ items: [claimItem] });

    const { result } = renderHook(() => useData());
    await waitFor(() =>
      expect(result.current?.nodes.some((n: any) => n.id === 'claim-uid')).toBe(true)
    );

    const node = result.current.nodes.find((n: any) => n.id === 'claim-uid');
    expect(node.label).toBe('my-claim');
    expect(node.subtitle).toBe('Database · default');
    expect(node.status).toBe('success');

    const edge = result.current.edges.find((e: any) => e.source === 'claim-uid');
    expect(edge?.target).toBe('xr-uid');
  });

  test('resolves Crossplane v2 compositionRef from spec.crossplane', async () => {
    const xrd = makeXRD('xdatabases.example.io', 'XDatabase', 'xdatabases', null);
    const comp = { metadata: { uid: 'comp-uid', name: 'my-composition' } };
    const xrItem = {
      metadata: { uid: 'xr-uid', name: 'v2-xr' },
      spec: { crossplane: { compositionRef: { name: 'my-composition' } } },
      status: { conditions: [] },
    };

    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[xrd], null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);
    vi.mocked(request).mockResolvedValue({ items: [xrItem] });

    const { result } = renderHook(() => useData());
    await waitFor(() =>
      expect(result.current?.edges.some((e: any) => e.source === 'xr-uid')).toBe(true)
    );

    const edge = result.current.edges.find((e: any) => e.source === 'xr-uid');
    expect(edge?.target).toBe('comp-uid');
  });

  test('links a claim to the XR of its referenced kind when XRs of different kinds share a name', async () => {
    const dbXrd = makeXRD('xdatabases.example.io', 'XDatabase', 'xdatabases', {
      kind: 'Database',
      plural: 'databases',
    });
    const cacheXrd = makeXRD('xcaches.example.io', 'XCache', 'xcaches', null);
    const dbXr = { metadata: { uid: 'db-xr', name: 'shared' }, spec: {}, status: { conditions: [] } };
    const cacheXr = { metadata: { uid: 'cache-xr', name: 'shared' }, spec: {}, status: { conditions: [] } };
    const claim = {
      metadata: { uid: 'claim-uid', name: 'c', namespace: 'default' },
      spec: { resourceRef: { apiVersion: 'example.io/v1alpha1', kind: 'XDatabase', name: 'shared' } },
      status: { conditions: [] },
    };

    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[cacheXrd, dbXrd], null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    vi.mocked(request).mockImplementation((path: string) => {
      if (path.endsWith('/xcaches')) return Promise.resolve({ items: [cacheXr] });
      if (path.endsWith('/xdatabases')) return Promise.resolve({ items: [dbXr] });
      if (path.endsWith('/databases')) return Promise.resolve({ items: [claim] });
      return Promise.resolve({ items: [] });
    });

    const { result } = renderHook(() => useData());
    await waitFor(() =>
      expect(result.current?.edges.some((e: any) => e.source === 'claim-uid')).toBe(true)
    );
    expect(result.current.edges.find((e: any) => e.source === 'claim-uid').target).toBe('db-xr');
  });

  test('links a namespaced XR only to composed resources in its own namespace', async () => {
    const xrd = makeXRD('webservices.example.io', 'WebService', 'webservices', null);
    const prodXr = {
      metadata: { uid: 'prod-xr', name: 'web', namespace: 'prod' },
      spec: { crossplane: { resourceRefs: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'web' }] } },
      status: { conditions: [] },
    };

    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[xrd], null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    vi.mocked(request).mockImplementation((path: string) => {
      if (path.endsWith('/webservices')) return Promise.resolve({ items: [prodXr] });
      if (path === '/apis/apps/v1') {
        return Promise.resolve({ resources: [{ kind: 'Deployment', name: 'deployments', namespaced: true }] });
      }
      if (path === '/apis/apps/v1/namespaces/prod/deployments') {
        return Promise.resolve({ items: [{ metadata: { uid: 'prod-dep', name: 'web', namespace: 'prod' } }] });
      }
      return Promise.resolve({ items: [{ metadata: { uid: 'staging-dep', name: 'web', namespace: 'staging' } }] });
    });

    const { result } = renderHook(() => useData());
    await waitFor(() =>
      expect(result.current?.edges.some((e: any) => e.source === 'prod-xr' && e.target === 'prod-dep')).toBe(true)
    );
    expect(result.current.nodes.some((n: any) => n.id === 'staging-dep')).toBe(false);
  });
});
