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
import { ClaimList } from './List';

function makeXRD(name: string, claimKind = 'Database', claimPlural = 'databases') {
  return {
    metadata: { name },
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind: 'XDatabase', plural: 'xdatabases' },
        claimNames: { kind: claimKind, plural: claimPlural },
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
      },
    },
  };
}

describe('ClaimList', () => {
  beforeEach(() => {
    mockListsByPlural(KubeObject.useList, {});
  });

  test('shows loader while XRDs are loading', () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    render(<ClaimList />);
    expect(screen.getByText('Loading claims...')).toBeTruthy();
  });

  test('shows message when no XRDs define claim types', () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    render(<ClaimList />);
    expect(screen.getByText(/No XRDs in this cluster define a claim type/)).toBeTruthy();
  });

  test('shows available claim types when there are XRDs but no claims', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    render(<ClaimList />);
    await waitFor(() => {
      expect(screen.getAllByText(/Database/).length).toBeGreaterThan(0);
    });
  });

  test('shows error message in Message column for a failing claim', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockListsByPlural(KubeObject.useList, {
      databases: [
        {
          metadata: { name: 'my-db', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
          status: {
            conditions: [
              { type: 'Ready', status: 'False', reason: 'Creating', message: 'Error: cannot provision database' },
              { type: 'Synced', status: 'True', reason: 'ReconcileSuccess', message: '' },
            ],
          },
        },
      ],
    });
    render(<ClaimList />);
    await waitFor(() => {
      expect(screen.getByText('Error: cannot provision database')).toBeTruthy();
    });
  });

  test('shows dash in Message column when claim has no error message', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockListsByPlural(KubeObject.useList, {
      databases: [
        {
          metadata: { name: 'my-db', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
          status: {
            conditions: [
              { type: 'Ready', status: 'True', reason: 'Available', message: '' },
            ],
          },
        },
      ],
    });
    render(<ClaimList />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeTruthy();
    });
  });

  test('honours the namespace picker for claim rows', async () => {
    mockedHook(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xdatabases.example.io')], null]);
    const claim = (name: string, namespace: string) => ({
      metadata: { name, namespace, creationTimestamp: '2024-01-01T00:00:00Z' },
      status: { conditions: [] },
    });
    mockListsByPlural(KubeObject.useList, { databases: [claim('prod-db', 'prod'), claim('staging-db', 'staging')] });
    vi.mocked(useFilterFunc).mockReturnValue(
      ((item: any) => !item.metadata?.namespace || item.metadata.namespace === 'prod') as any
    );
    render(<ClaimList />);
    await waitFor(() => expect(screen.getByText('prod-db')).toBeTruthy());
    expect(screen.queryByText('staging-db')).toBeNull();
    expect(screen.getByText('Claims (1)')).toBeTruthy();
    vi.mocked(useFilterFunc).mockReturnValue((() => true) as any);
  });
});
