import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { mockedHook } from '../testing';

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
    <section><h2>{title}</h2>{headerProps?.titleSideActions}{headerProps?.actions}{children}</section>
  ),
  Link: ({ children }: any) => <span>{children}</span>,
  ActionButton: ({ description, onClick, iconButtonProps }: any) => (
    <button aria-label={description} onClick={onClick} disabled={iconButtonProps?.disabled}>
      {description}
    </button>
  ),
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

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { useParams } from 'react-router-dom';
import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { ManagedResourceDetail } from './Detail';

function makeMR(ready = 'True', synced = 'True') {
  return {
    metadata: { name: 'my-db', creationTimestamp: '2024-01-01T00:00:00Z' },
    patch: vi.fn(),
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
    mockedHook(KubeObject.useList).mockReturnValue([null, null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('shows error when MR not found in list', () => {
    mockedHook(KubeObject.useList).mockReturnValue([[], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText(/Failed to load/)).toBeTruthy();
  });

  test('renders MR kind and API version when loaded', () => {
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('NoSQLDB')).toBeTruthy();
    expect(screen.getByText('nopesql.crossplane.io/v1alpha1')).toBeTruthy();
  });

  test('shows Ready chip when ready and synced', () => {
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  test('shows Sync Failed chip when not synced', () => {
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR('False', 'False')], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Sync Failed')).toBeTruthy();
  });

  test('renders a reconcile button', () => {
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByRole('button', { name: 'Trigger reconcile' })).toBeTruthy();
  });

  test('loads a namespaced MR through a namespaced class and fetches its spec from the namespaced path', () => {
    vi.mocked(useParams).mockReturnValueOnce({
      group: 'nopesql.crossplane.io',
      version: 'v1alpha1',
      plural: 'nosqldbs',
      namespace: 'prod',
      name: 'my-db',
    });
    mockedHook(KubeObject.useList).mockClear();
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(KubeObject.useList).toHaveBeenCalledWith({ namespace: 'prod' });
    expect((mockedHook(KubeObject.useList).mock.contexts[0] as any).isNamespaced).toBe(true);
    expect(request).toHaveBeenCalledWith(
      '/apis/nopesql.crossplane.io/v1alpha1/namespaces/prod/nosqldbs/my-db'
    );
  });

  test('keeps the Spec section visible with an empty-state message when no spec is available', async () => {
    mockedHook(KubeObject.useList).mockReturnValue([[makeMR()], null]);
    render(<ManagedResourceDetail />);
    expect(screen.getByText('Spec')).toBeTruthy();
    expect(await screen.findByText('No spec available')).toBeTruthy();
  });
});
