import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { KubeObject } from './__mocks__/headlamp-k8s-cluster';
import { mockedHook, mockListsByPlural } from './testing';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('./resources', () => ({
  Provider: { useList: vi.fn().mockReturnValue([null, null]) },
  Configuration: { useList: vi.fn().mockReturnValue([null, null]) },
  CompositeResourceDefinition: { useList: vi.fn().mockReturnValue([null, null]) },
  Composition: { useList: vi.fn().mockReturnValue([null, null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }: any) => <section><h2>{title}</h2>{children}</section>,
  Table: ({ data, emptyMessage, columns }: any) => (
    <>
      {!data || data.length === 0
        ? <span>{emptyMessage}</span>
        : (data as any[]).map((row, i) => (
            <div key={i}>
              {(columns as any[]).map((col: any) => (
                <span key={col.header}>
                  {col.Cell ? col.Cell({ row: { original: row } }) : col.accessorFn(row)}
                </span>
              ))}
            </div>
          ))}
    </>
  ),
  Link: ({ children, style }: any) => <span style={style}>{children}</span>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  useFilterFunc: () => () => true,
}));

vi.mock('./components/CrossplaneInfoDialog', () => ({
  CrossplaneInfoButton: () => null,
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { CrossplaneOverview } from './overview';
import { CompositeResourceDefinition, Composition, Configuration, Provider } from './resources';

const mockRequest = vi.mocked(request);

function makePackageResource(name: string, condType: string, condStatus: string) {
  const conditions: any[] = [
    { type: condType, status: condStatus, reason: 'Available', message: '' },
  ];
  // Providers and Configurations need both Installed and Healthy conditions.
  if (condType === 'Healthy') {
    conditions.push({ type: 'Installed', status: condStatus, reason: 'Available', message: '' });
  }
  return {
    metadata: { name },
    jsonData: { metadata: { name }, status: { conditions } },
  };
}

function makeXRD(name: string, condStatus = 'True', withClaimNames = false) {
  return {
    metadata: { name },
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind: 'XDatabase', plural: 'xdatabases' },
        ...(withClaimNames ? { claimNames: { kind: 'Database', plural: 'databases' } } : {}),
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
      },
      metadata: { name },
      status: {
        conditions: [
          { type: 'Established', status: condStatus, reason: 'Available', message: '' },
        ],
      },
    },
  };
}

describe('CrossplaneOverview', () => {
  beforeEach(() => {
    mockListsByPlural(KubeObject.useList, {});
  });

  test('shows loading dashes while resources are loading', () => {
    mockedHook(Provider.useList).mockReturnValue([null, null]);
    mockedHook(Configuration.useList).mockReturnValue([null, null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    mockedHook(Composition.useList).mockReturnValue([null, null]);
    render(<CrossplaneOverview />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  test('shows resource counts when resources are loaded', async () => {
    mockedHook(Provider.useList).mockReturnValue([[makePackageResource('p1', 'Healthy', 'True')], null]);
    mockedHook(Configuration.useList).mockReturnValue([[makePackageResource('c1', 'Healthy', 'True')], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xrd1')], null]);
    mockedHook(Composition.useList).mockReturnValue([[makePackageResource('comp1', 'Ready', 'True')], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  test('shows All resources are ready when everything is healthy', async () => {
    mockedHook(Provider.useList).mockReturnValue([[makePackageResource('p1', 'Healthy', 'True')], null]);
    mockedHook(Configuration.useList).mockReturnValue([[makePackageResource('c1', 'Healthy', 'True')], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xrd1')], null]);
    mockedHook(Composition.useList).mockReturnValue([[makePackageResource('comp1', 'Ready', 'True')], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('All resources are ready')).toBeTruthy();
    });
  });

  test('shows not-ready entry when a provider is unhealthy', async () => {
    mockedHook(Provider.useList).mockReturnValue([
      [makePackageResource('my-provider', 'Healthy', 'False')],
      null,
    ]);
    mockedHook(Configuration.useList).mockReturnValue([[], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    mockedHook(Composition.useList).mockReturnValue([[], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('my-provider')).toBeTruthy();
    });
  });

  test('surfaces a failing XR as the XR name when it has no claimRef', async () => {
    mockedHook(Provider.useList).mockReturnValue([[], null]);
    mockedHook(Configuration.useList).mockReturnValue([[], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockedHook(Composition.useList).mockReturnValue([[], null]);
    mockListsByPlural(KubeObject.useList, {
      xdatabases: [
        {
          metadata: { name: 'my-xdb', creationTimestamp: '2024-01-01T00:00:00Z' },
          spec: {},
          status: {
            conditions: [
              { type: 'Ready', status: 'False', reason: 'Creating', message: 'compose failed' },
            ],
          },
        },
      ],
    });
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('my-xdb')).toBeTruthy();
    });
  });

  test('surfaces a failing XR as the claim name when it has a claimRef', async () => {
    mockedHook(Provider.useList).mockReturnValue([[], null]);
    mockedHook(Configuration.useList).mockReturnValue([[], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io', 'True', true)],
      null,
    ]);
    mockedHook(Composition.useList).mockReturnValue([[], null]);
    mockListsByPlural(KubeObject.useList, {
      xdatabases: [
        {
          metadata: { name: 'my-xdb', creationTimestamp: '2024-01-01T00:00:00Z' },
          spec: {
            claimRef: { apiVersion: 'example.io/v1alpha1', kind: 'Database', name: 'my-claim', namespace: 'default' },
          },
          status: {
            conditions: [
              { type: 'Ready', status: 'False', reason: 'Creating', message: 'compose failed' },
            ],
          },
        },
      ],
    });
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('my-claim')).toBeTruthy();
    });
  });

  test('counts managed resources cheaply and only lists populated types for readiness', async () => {
    mockedHook(Provider.useList).mockReturnValue([[], null]);
    mockedHook(Configuration.useList).mockReturnValue([[], null]);
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    mockedHook(Composition.useList).mockReturnValue([[], null]);
    const crd = (plural: string) => ({
      spec: { group: 'aws.io', names: { kind: plural, plural }, versions: [{ name: 'v1', storage: true }] },
    });
    mockRequest.mockReset();
    mockRequest.mockImplementation((path: string) => {
      if (path.includes('labelSelector')) return Promise.resolve({ items: [crd('buckets'), crd('queues')] });
      if (path === '/apis/aws.io/v1/buckets?limit=1') {
        return Promise.resolve({ items: [{}], metadata: { continue: 'x', remainingItemCount: 1 } });
      }
      if (path === '/apis/aws.io/v1/queues?limit=1') return Promise.resolve({ items: [], metadata: {} });
      if (path === '/apis/aws.io/v1/buckets') {
        return Promise.resolve({
          items: [
            { status: { conditions: [{ type: 'Ready', status: 'True' }] } },
            { status: { conditions: [{ type: 'Ready', status: 'False' }] } },
          ],
        });
      }
      return Promise.resolve({ items: [] });
    });
    render(<CrossplaneOverview />);
    await waitFor(() => expect(screen.getByText('1 / 2 ready')).toBeTruthy());
    expect(mockRequest).not.toHaveBeenCalledWith('/apis/aws.io/v1/queues');
  });
});

