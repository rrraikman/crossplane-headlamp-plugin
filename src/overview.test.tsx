import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

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
  SimpleTable: ({ data, emptyMessage, columns }: any) => (
    <>
      {!data || data.length === 0
        ? <span>{emptyMessage}</span>
        : (data as any[]).map((row, i) => (
            <div key={i}>{(columns as any[]).map((col: any) => <span key={col.label}>{col.getter(row)}</span>)}</div>
          ))}
    </>
  ),
  Link: ({ children, style }: any) => <span style={style}>{children}</span>,
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
  test('shows loading dashes while resources are loading', () => {
    vi.mocked(Provider.useList).mockReturnValue([null, null]);
    vi.mocked(Configuration.useList).mockReturnValue([null, null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([null, null]);
    render(<CrossplaneOverview />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  test('shows resource counts when resources are loaded', async () => {
    vi.mocked(Provider.useList).mockReturnValue([[makePackageResource('p1', 'Healthy', 'True')], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[makePackageResource('c1', 'Healthy', 'True')], null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xrd1')], null]);
    vi.mocked(Composition.useList).mockReturnValue([[makePackageResource('comp1', 'Ready', 'True')], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  test('shows All resources are ready when everything is healthy', async () => {
    vi.mocked(Provider.useList).mockReturnValue([[makePackageResource('p1', 'Healthy', 'True')], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[makePackageResource('c1', 'Healthy', 'True')], null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xrd1')], null]);
    vi.mocked(Composition.useList).mockReturnValue([[makePackageResource('comp1', 'Ready', 'True')], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('All resources are ready')).toBeTruthy();
    });
  });

  test('shows not-ready entry when a provider is unhealthy', async () => {
    vi.mocked(Provider.useList).mockReturnValue([
      [makePackageResource('my-provider', 'Healthy', 'False')],
      null,
    ]);
    vi.mocked(Configuration.useList).mockReturnValue([[], null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<CrossplaneOverview />);
    await waitFor(() => {
      expect(screen.getByText('my-provider')).toBeTruthy();
    });
  });

  test('surfaces a failing XR as the XR name when it has no claimRef', async () => {
    vi.mocked(Provider.useList).mockReturnValue([[], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[], null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    mockRequest.mockResolvedValue({
      items: [
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
    vi.mocked(Provider.useList).mockReturnValue([[], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[], null]);
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io', 'True', true)],
      null,
    ]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    mockRequest.mockResolvedValue({
      items: [
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
});
