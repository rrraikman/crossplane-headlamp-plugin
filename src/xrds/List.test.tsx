import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  CompositeResourceDefinition: { useList: vi.fn().mockReturnValue([null, null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: any) => <span>{children}</span>,
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
}));

import { CompositeResourceDefinition } from '../resources';
import { XRDList } from './List';

function makeXRD(name: string, kind = 'XDatabase', claimKind = 'Database') {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind, plural: kind.toLowerCase() + 's' },
        claimNames: { kind: claimKind },
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
      },
      status: { conditions: [{ type: 'Established', status: 'True' }] },
    },
  };
}

describe('XRDList', () => {
  test('shows empty message when no XRDs', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[], null]);
    render(<XRDList />);
    expect(screen.getByText('No composite resource definitions found')).toBeTruthy();
  });

  test('renders XRD names and groups', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([
      [makeXRD('xdatabases.example.io'), makeXRD('xnetworks.example.io', 'XNetwork', 'Network')],
      null,
    ]);
    render(<XRDList />);
    expect(screen.getByText('xdatabases.example.io')).toBeTruthy();
    expect(screen.getByText('xnetworks.example.io')).toBeTruthy();
  });

  test('renders kind and claim kind columns', () => {
    vi.mocked(CompositeResourceDefinition.useList).mockReturnValue([[makeXRD('xdbs.example.io')], null]);
    render(<XRDList />);
    expect(screen.getByText('XDatabase')).toBeTruthy();
    expect(screen.getByText('Database')).toBeTruthy();
  });
});
