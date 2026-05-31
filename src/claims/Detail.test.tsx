import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('./Detail.utils', () => ({
  claimStatusLabel: vi.fn((ready: string, synced: string) => {
    if (ready === 'True' && synced === 'True') return 'Ready';
    if (synced !== 'True') return 'Sync Failed';
    return 'Not Ready';
  }),
  fetchXRResourceRefs: vi.fn().mockResolvedValue([]),
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
    group: 'example.io',
    version: 'v1alpha1',
    plural: 'databases',
    namespace: 'default',
    name: 'my-db',
  }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));
vi.mock('../components/EventsTable', () => ({ EventsTable: () => null }));
vi.mock('../managed/ManagedResources', () => ({ ManagedResources: () => null }));

import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { ClaimDetail } from './Detail';

function makeClaim(ready = 'True', synced = 'True') {
  return {
    metadata: { name: 'my-db', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      kind: 'Database',
      apiVersion: 'example.io/v1alpha1',
      spec: { compositionRef: { name: 'xdb-composition' } },
      status: {
        conditions: [
          { type: 'Ready', status: ready, reason: ready === 'True' ? 'Available' : 'Creating', message: '' },
          { type: 'Synced', status: synced, reason: synced === 'True' ? 'ReconcileSuccess' : 'ReconcileError', message: '' },
        ],
      },
      metadata: { name: 'my-db', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
    },
  };
}

describe('ClaimDetail', () => {
  test('shows loader while claim list is loading', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([null, null]);
    render(<ClaimDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('shows error when claim not found in list', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[], null]);
    render(<ClaimDetail />);
    expect(screen.getByText(/Failed to load/)).toBeTruthy();
  });

  test('renders claim namespace and kind when loaded', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim()], null]);
    render(<ClaimDetail />);
    expect(screen.getByText('Database')).toBeTruthy();
    expect(screen.getByText('default')).toBeTruthy();
  });

  test('shows Ready chip when ready and synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim()], null]);
    render(<ClaimDetail />);
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  test('shows Sync Failed chip when not synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim('False', 'False')], null]);
    render(<ClaimDetail />);
    expect(screen.getByText('Sync Failed')).toBeTruthy();
  });
});
