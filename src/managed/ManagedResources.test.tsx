import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ resources: [], items: [] }),
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
  Link: ({ children }: any) => <span>{children}</span>,
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ManagedResources } from './ManagedResources';

describe('ManagedResources', () => {
  test('shows empty message when no resourceRefs provided', async () => {
    render(<ManagedResources resourceRefs={undefined} />);
    await waitFor(() => {
      expect(screen.getByText('No managed resources found')).toBeTruthy();
    });
  });

  test('shows empty message when resourceRefs is empty', async () => {
    render(<ManagedResources resourceRefs={[]} />);
    await waitFor(() => {
      expect(screen.getByText('No managed resources found')).toBeTruthy();
    });
  });

  test('shows MR name after fetching resource list', async () => {
    vi.mocked(request).mockImplementation((path: string) => {
      if (path === '/apis/example.io/v1alpha1') {
        return Promise.resolve({ resources: [{ kind: 'NoSQLDB', name: 'nosqldbs' }] });
      }
      return Promise.resolve({
        items: [{
          kind: 'NoSQLDB',
          apiVersion: 'example.io/v1alpha1',
          metadata: { name: 'my-mr', creationTimestamp: '2024-01-01T00:00:00Z' },
          status: { conditions: [] },
        }],
      });
    });
    render(<ManagedResources resourceRefs={[{ apiVersion: 'example.io/v1alpha1', kind: 'NoSQLDB', name: 'my-mr' }]} />);
    await waitFor(() => {
      expect(screen.getByText('my-mr')).toBeTruthy();
    });
  });
});
