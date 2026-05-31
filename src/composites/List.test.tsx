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
  test('shows loader while XRDs are loading', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([null, null]);
    render(<CompositeResourceList />);
    expect(screen.getByText('Loading composite resources...')).toBeTruthy();
  });

  test('shows empty message when no XRs exist', async () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    render(<CompositeResourceList />);
    await waitFor(() => {
      expect(screen.getByText('No composite resources found')).toBeTruthy();
    });
  });

  test('shows XR names after async fetch', async () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io')],
      null,
    ]);
    vi.mocked(request).mockResolvedValue({ items: [makeXRItem('my-xdb')] });
    render(<CompositeResourceList />);
    await waitFor(() => {
      expect(screen.getByText('my-xdb')).toBeTruthy();
    });
  });
});
