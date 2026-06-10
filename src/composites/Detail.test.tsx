import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('./Detail.utils', () => ({
  compositeStatusLabel: vi.fn((ready: string, synced: string) => {
    if (ready === 'True' && synced === 'True') return 'Ready';
    if (synced !== 'True') return 'Sync Failed';
    return 'Not Ready';
  }),
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
    group: 'example.io',
    version: 'v1alpha1',
    plural: 'xdatabases',
    name: 'my-xdb',
  }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));
vi.mock('../components/EventsTable', () => ({ EventsTable: () => null }));
vi.mock('../managed/ManagedResources', () => ({ ManagedResources: () => null }));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { CompositeDetail } from './Detail';

function makeXR(ready = 'True', synced = 'True') {
  return {
    metadata: { name: 'my-xdb', creationTimestamp: '2024-01-01T00:00:00Z' },
    patch: vi.fn(),
    jsonData: {
      kind: 'XDatabase',
      apiVersion: 'example.io/v1alpha1',
      spec: { compositionRef: { name: 'xdb-composition' } },
      status: {
        conditions: [
          { type: 'Ready', status: ready, reason: ready === 'True' ? 'Available' : 'Creating', message: '' },
          { type: 'Synced', status: synced, reason: synced === 'True' ? 'ReconcileSuccess' : 'ReconcileError', message: '' },
        ],
      },
      metadata: { name: 'my-xdb', creationTimestamp: '2024-01-01T00:00:00Z' },
    },
  };
}

describe('CompositeDetail', () => {
  test('shows loader while XR list is loading', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([null, null]);
    render(<CompositeDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('shows error when XR not found in list', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[], null]);
    render(<CompositeDetail />);
    expect(screen.getByText(/Failed to load/)).toBeTruthy();
  });

  test('renders XR kind and API version when loaded', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeXR()], null]);
    render(<CompositeDetail />);
    expect(screen.getByText('XDatabase')).toBeTruthy();
    expect(screen.getByText('example.io/v1alpha1')).toBeTruthy();
  });

  test('shows Ready chip when ready and synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeXR()], null]);
    render(<CompositeDetail />);
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  test('shows Sync Failed chip when not synced', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeXR('False', 'False')], null]);
    render(<CompositeDetail />);
    expect(screen.getByText('Sync Failed')).toBeTruthy();
  });

  test('renders a reconcile button', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeXR()], null]);
    render(<CompositeDetail />);
    expect(screen.getByRole('button', { name: 'Trigger reconcile' })).toBeTruthy();
  });
});
