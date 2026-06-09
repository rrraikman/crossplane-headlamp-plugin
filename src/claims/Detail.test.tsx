import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('./Detail.utils', () => ({
  fetchXRData: vi.fn().mockResolvedValue({ resourceRefs: [], conditions: [] }),
  fetchXRResourceRefs: vi.fn().mockResolvedValue([]),
  fetchFailingManagedResource: vi.fn().mockResolvedValue(null),
  resolveXRPlural: vi.fn().mockResolvedValue('xdatabases'),
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
import { fetchFailingManagedResource, fetchXRData } from './Detail.utils';

function makeClaim(ready = 'True', synced = 'True', message = '') {
  return {
    metadata: { name: 'my-db', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      kind: 'Database',
      apiVersion: 'example.io/v1alpha1',
      spec: {
        compositionRef: { name: 'xdb-composition' },
        resourceRef: { apiVersion: 'example.io/v1alpha1', kind: 'XDatabase', name: 'my-db-xr' },
      },
      status: {
        conditions: [
          { type: 'Ready', status: ready, reason: ready === 'True' ? 'Available' : 'Creating', message },
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

  test('shows error banner with XR condition message when XR is failing', async () => {
    vi.mocked(fetchXRData).mockResolvedValueOnce({
      resourceRefs: [],
      conditions: [{ type: 'Ready', status: 'False', message: 'cannot compose resources: provider error' }],
    });
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim('False', 'True')], null]);
    render(<ClaimDetail />);
    await waitFor(() => {
      expect(screen.getByText('cannot compose resources: provider error')).toBeTruthy();
    });
  });

  test('falls back to claim condition message when XR has no message', async () => {
    vi.mocked(fetchXRData).mockResolvedValueOnce({ resourceRefs: [], conditions: [] });
    vi.mocked(KubeObject.useList).mockReturnValue([
      [makeClaim('False', 'True', 'claim-level error message')],
      null,
    ]);
    render(<ClaimDetail />);
    await waitFor(() => {
      expect(screen.getByText('claim-level error message')).toBeTruthy();
    });
  });

  test('shows error banner linking to failing MR when one is found', async () => {
    vi.mocked(fetchXRData).mockResolvedValueOnce({
      resourceRefs: [{ apiVersion: 'aws.io/v1beta1', kind: 'RDSInstance', name: 'my-rds' }],
      conditions: [{ type: 'Ready', status: 'False', message: 'rds provisioning failed' }],
    });
    vi.mocked(fetchFailingManagedResource).mockResolvedValueOnce({
      kind: 'RDSInstance',
      name: 'my-rds',
      routeParams: { group: 'aws.io', version: 'v1beta1', plural: 'rdsinstances', name: 'my-rds' },
    });
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim('False', 'True')], null]);
    render(<ClaimDetail />);
    await waitFor(() => {
      expect(screen.getByText('rds provisioning failed')).toBeTruthy();
    });
  });

  test('no error banner when claim is ready', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeClaim('True', 'True')], null]);
    render(<ClaimDetail />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
