import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { mockedHook, mockListsByPlural } from '../testing';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../resources', () => ({
  CompositeResourceDefinition: { useList: vi.fn().mockReturnValue([null, null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionFilterHeader: ({ title }: any) => <span>{title}</span>,
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
  SectionBox: ({ title, children }: any) => <section><h2>{title}</h2>{children}</section>,
  // Applies filterFunction like the real Table, so namespace filtering is observable.
  Table: ({ data: rawData, emptyMessage, columns, filterFunction }: any) => {
    const data = filterFunction ? (rawData ?? []).filter((r: any) => filterFunction(r)) : rawData;
    return (
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
    );
  },
  Link: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  useFilterFunc: vi.fn(() => () => true),
}));

import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { CompositeResourceDefinition } from '../resources';
import { CompositeResourceList } from './List';

function makeXRD(name: string, kind = 'XDatabase', plural = 'xdatabases') {
  return {
    metadata: { name },
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind, plural },
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
      },
    },
  };
}

function makeXRItem(name: string) {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    status: { conditions: [] },
  };
}

describe('CompositeResourceList', () => {
  beforeEach(() => {
    mockListsByPlural(KubeObject.useList, {});
  });

  test('shows loader while XRDs are loading', () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    render(<CompositeResourceList />);
    expect(screen.getByText('Loading composite resources...')).toBeTruthy();
  });

  test('shows empty message when no XRs exist', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    render(<CompositeResourceList />);
    await waitFor(() => {
      expect(screen.getByText('No composite resources found')).toBeTruthy();
    });
  });

  test('shows XR names after async fetch', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockListsByPlural(KubeObject.useList, { xdatabases: [makeXRItem('my-xdb')] });
    render(<CompositeResourceList />);
    await waitFor(() => {
      expect(screen.getByText('my-xdb')).toBeTruthy();
    });
  });

  test('honours the namespace picker for XR rows and keeps cluster-scoped XRs', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xdatabases.example.io')], null]);
    const xr = (name: string, namespace?: string) => ({
      metadata: { name, namespace, creationTimestamp: '2024-01-01T00:00:00Z' },
      status: { conditions: [] },
    });
    mockListsByPlural(KubeObject.useList, {
      xdatabases: [xr('prod-xr', 'prod'), xr('staging-xr', 'staging'), xr('cluster-xr')],
    });
    vi.mocked(useFilterFunc).mockReturnValue(
      ((item: any) => !item.metadata?.namespace || item.metadata.namespace === 'prod') as any
    );
    render(<CompositeResourceList />);
    await waitFor(() => expect(screen.getByText('prod-xr')).toBeTruthy());
    expect(screen.getByText('cluster-xr')).toBeTruthy();
    expect(screen.queryByText('staging-xr')).toBeNull();
    expect(screen.getByText('Composite Resources (2)')).toBeTruthy();
    vi.mocked(useFilterFunc).mockReturnValue((() => true) as any);
  });
});
