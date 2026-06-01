import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
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
import { ManagedResourceBrowser } from './List';

function makeCRD(kind: string, group: string, plural: string) {
  return {
    spec: {
      group,
      names: { kind, plural, categories: ['managed'] },
      versions: [{ name: 'v1alpha1', storage: true }],
    },
  };
}

describe('ManagedResourceBrowser', () => {
  test('shows loader while types are loading', () => {
    vi.mocked(request).mockReturnValue(new Promise(() => {}));
    render(<ManagedResourceBrowser />);
    expect(screen.getByText('Loading managed resource types...')).toBeTruthy();
  });

  test('shows empty message when no CRDs found', async () => {
    vi.mocked(request).mockResolvedValue({ items: [] });
    render(<ManagedResourceBrowser />);
    await waitFor(() => {
      expect(screen.getByText(/No managed resource types/)).toBeTruthy();
    });
  });

  test('shows MR type kind after fetching CRDs', async () => {
    vi.mocked(request).mockImplementation((path: string) => {
      if (path.includes('labelSelector')) {
        return Promise.resolve({ items: [makeCRD('NoSQLDB', 'nopesql.crossplane.io', 'nosqldbs')] });
      }
      return Promise.resolve({ items: [{ metadata: { name: 'my-mr', creationTimestamp: '2024-01-01T00:00:00Z' }, status: { conditions: [] } }] });
    });
    render(<ManagedResourceBrowser />);
    await waitFor(() => {
      expect(screen.getAllByText('NoSQLDB').length).toBeGreaterThan(0);
    });
  });

  test('falls back to category filter when label selector returns empty', async () => {
    vi.mocked(request).mockImplementation((path: string) => {
      if (path.includes('labelSelector')) return Promise.resolve({ items: [] });
      if (path === '/apis/apiextensions.k8s.io/v1/customresourcedefinitions') {
        return Promise.resolve({
          items: [
            makeCRD('Bucket', 's3.aws.crossplane.io', 'buckets'),
            { spec: { group: 'other.io', names: { kind: 'Thing', plural: 'things', categories: [] }, versions: [{ name: 'v1', storage: true }] } },
          ],
        });
      }
      // Count fetch for Bucket — return 1 instance so hideEmpty doesn't filter it
      return Promise.resolve({ items: [{ metadata: { name: 'my-bucket' } }] });
    });
    render(<ManagedResourceBrowser />);
    await waitFor(() => {
      expect(screen.getAllByText('Bucket').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Thing')).toBeNull();
  });

  test('shows error message when CRD fetch fails', async () => {
    vi.mocked(request).mockRejectedValue(new Error('forbidden'));
    render(<ManagedResourceBrowser />);
    await waitFor(() => {
      expect(screen.getByText('forbidden')).toBeTruthy();
    });
  });
});
