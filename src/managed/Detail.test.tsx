import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ spec: null }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  BackLink: () => null,
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
  NameValueTable: ({ rows }: { rows: { name: string; value: any; hide?: boolean }[] }) => (
    <dl>{rows.filter(r => !r.hide).map(r => <div key={r.name}><dt>{r.name}</dt><dd>{r.value}</dd></div>)}</dl>
  ),
  SectionBox: ({ title, children, headerProps }: any) => (
    <section><h2>{title}</h2>{headerProps?.titleSideActions}{children}</section>
  ),
  Link: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({
    group: 'nopesql.crossplane.io',
    version: 'v1alpha1',
    plural: 'nosqldbs',
    name: 'my-db',
  }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));
vi.mock('../components/EventsTable', () => ({ EventsTable: () => null }));

import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { ManagedResourceDetail } from './Detail';

function makeMR(ready = 'True', synced = 'True') {
  return {
    metadata: { name: 'my-db', creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      kind: 'NoSQLDB',
      apiVersion: 'nopesql.crossplane.io/v1alpha1',
      status: {
        conditions: [
          { type: 'Ready', status: ready, reason: ready === 'True' ? 'Available' : 'Creating', message: '' },
          { type: 'Synced', status: synced, reason: synced === 'True' ? 'ReconcileSuccess' : 'ReconcileError', message: '' },
        ],
      },
      metadata: { name: 'my-db', creationTimestamp: '2024-01-01T00:00:00Z' },
    },
  };
}

describe('ManagedResourceDetail', () => {
  test('shows loader while MR list is loading', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([null, null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('shows error when MR not found in list', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText(/Failed to load/)).toBeTruthy();
  });

  test('renders MR kind and API version when loaded', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('NoSQLDB')).toBeTruthy();
    expect(screen.getByText('nopesql.crossplane.io/v1alpha1')).toBeTruthy();
  });

  test('shows Ready chip when ready and synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  test('shows Sync Failed chip when not synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeMR('False', 'False')], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Sync Failed')).toBeTruthy();
  });
});
