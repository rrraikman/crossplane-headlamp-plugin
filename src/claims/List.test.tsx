import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../resources', () => ({
  CompositeResourceDefinition: { useList: vi.fn().mockReturnValue([null, null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
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
  Link: ({ children }: any) => <span>{children}</span>,
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { CompositeResourceDefinition } from '../resources';
import { ClaimList } from './List';

const mockRequest = vi.mocked(request);

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
  test('shows loader while XRDs are loading', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    render(<ClaimList />);
    expect(screen.getByText('Loading claims...')).toBeTruthy();
  });

  test('shows message when no XRDs define claim types', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    render(<ClaimList />);
    expect(screen.getByText(/No XRDs in this cluster define a claim type/)).toBeTruthy();
  });

  test('shows available claim types when there are XRDs but no claims', async () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    render(<ClaimList />);
    await waitFor(() => {
      expect(screen.getAllByText(/Database/).length).toBeGreaterThan(0);
    });
  });

  test('shows error message in Message column for a failing claim', async () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockRequest.mockResolvedValueOnce({
      items: [
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
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    mockRequest.mockResolvedValueOnce({
      items: [
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
});
