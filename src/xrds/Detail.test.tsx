import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../resources', () => ({
  CompositeResourceDefinition: { useGet: vi.fn().mockReturnValue([null, null]) },
  Composition: { useList: vi.fn().mockReturnValue([[], null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
  NameValueTable: ({ rows }: { rows: { name: string; value: any; hide?: boolean }[] }) => (
    <dl>{rows.filter(r => !r.hide).map(r => <div key={r.name}><dt>{r.name}</dt><dd>{r.value}</dd></div>)}</dl>
  ),
  SectionBox: ({ title, children, headerProps }: any) => (
    <section><h2>{title}</h2>{headerProps?.titleSideActions}{children}</section>
  ),
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

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ name: 'xdatabases.example.io' }),
}));

vi.mock('./SchemaTree', () => ({
  SchemaTree: ({ schema }: any) =>
    schema ? <div data-testid="schema-tree">Schema</div> : null,
}));

import { CompositeResourceDefinition, Composition } from '../resources';
import { XRDDetail } from './Detail';

function makeXRD(overrides: any = {}) {
  return {
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind: 'XDatabase', plural: 'xdatabases' },
        claimNames: { kind: 'Database', plural: 'databases' },
        versions: [{ name: 'v1alpha1', served: true, referenceable: true }],
        ...overrides,
      },
      status: { conditions: [{ type: 'Established', status: 'True' }] },
      metadata: { name: 'xdatabases.example.io', creationTimestamp: '2024-01-01T00:00:00Z' },
    },
    metadata: { name: 'xdatabases.example.io', creationTimestamp: '2024-01-01T00:00:00Z' },
  };
}

describe('XRDDetail', () => {
  test('shows loader while XRD is loading', () => {
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([null, null]);
    render(<XRDDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('renders XRD group and kind when loaded', () => {
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([makeXRD(), null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<XRDDetail />);
    expect(screen.getByText('example.io')).toBeTruthy();
    expect(screen.getByText('XDatabase')).toBeTruthy();
  });

  test('shows Established chip when established', () => {
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([makeXRD(), null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<XRDDetail />);
    expect(screen.getByText('Established')).toBeTruthy();
  });

  test('shows Not Established chip when not established', () => {
    const xrd = makeXRD();
    xrd.jsonData.status.conditions = [{ type: 'Established', status: 'False' }];
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([xrd, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<XRDDetail />);
    expect(screen.getByText('Not Established')).toBeTruthy();
  });

  test('renders schema section when XRD version has openAPIV3Schema', () => {
    const xrd = makeXRD({
      versions: [
        {
          name: 'v1alpha1',
          served: true,
          referenceable: true,
          schema: {
            openAPIV3Schema: {
              type: 'object',
              properties: { spec: { type: 'object' } },
            },
          },
        },
      ],
    });
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([xrd, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<XRDDetail />);
    expect(screen.getByText('Schema (v1alpha1)')).toBeTruthy();
    expect(screen.getByTestId('schema-tree')).toBeTruthy();
  });

  test('shows referencing compositions', () => {
    const comp = {
      metadata: { name: 'xdb-composition', creationTimestamp: '2024-01-01T00:00:00Z' },
      jsonData: { spec: { compositeTypeRef: { kind: 'XDatabase', apiVersion: 'example.io/v1alpha1' } } },
    };
    vi.mocked(CompositeResourceDefinition.useGet).mockReturnValue([makeXRD(), null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);
    render(<XRDDetail />);
    expect(screen.getByText('xdb-composition')).toBeTruthy();
  });
});
