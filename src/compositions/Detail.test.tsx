import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  Composition: { useGet: vi.fn().mockReturnValue([null, null]) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  BackLink: () => null,
  Link: ({ children }: any) => <span>{children}</span>,
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
  NameValueTable: ({ rows }: { rows: { name: string; value: any; hide?: boolean }[] }) => (
    <dl>{rows.filter(r => !r.hide).map(r => <div key={r.name}><dt>{r.name}</dt><dd>{r.value}</dd></div>)}</dl>
  ),
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

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ name: 'my-composition' }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));

import { Composition } from '../resources';
import { CompositionDetail } from './Detail';

function makeComposition(overrides: any = {}) {
  return {
    jsonData: {
      spec: {
        compositeTypeRef: { apiVersion: 'example.io/v1', kind: 'XDatabase' },
        mode: 'Resources',
        resources: [{ name: 'rds', base: { kind: 'RDSInstance', apiVersion: 'aws.upbound.io/v1beta1' }, patches: [] }],
        pipeline: [],
        ...overrides,
      },
      status: { conditions: [] },
      metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
    },
    metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
  };
}

describe('CompositionDetail', () => {
  test('shows loader while composition is loading', () => {
    vi.mocked(Composition.useGet).mockReturnValue([null, null]);
    render(<CompositionDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('renders composite type and mode', () => {
    vi.mocked(Composition.useGet).mockReturnValue([makeComposition(), null]);
    render(<CompositionDetail />);
    expect(screen.getByText('example.io/v1 / XDatabase')).toBeTruthy();
    expect(screen.getByText('Resources')).toBeTruthy();
  });

  test('renders pipeline steps when mode is Pipeline', () => {
    const comp = makeComposition({
      mode: 'Pipeline',
      pipeline: [{ step: 'patch-and-transform', functionRef: { name: 'function-patch-and-transform' } }],
    });
    vi.mocked(Composition.useGet).mockReturnValue([comp, null]);
    render(<CompositionDetail />);
    expect(screen.getByText('patch-and-transform')).toBeTruthy();
    expect(screen.getByText('function-patch-and-transform')).toBeTruthy();
  });

  test('renders — for pipeline step with no functionRef', () => {
    const comp = makeComposition({
      mode: 'Pipeline',
      pipeline: [{ step: 'my-step' }],
    });
    vi.mocked(Composition.useGet).mockReturnValue([comp, null]);
    render(<CompositionDetail />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  test('renders resources table when mode is Resources', () => {
    vi.mocked(Composition.useGet).mockReturnValue([makeComposition(), null]);
    render(<CompositionDetail />);
    expect(screen.getByText('rds')).toBeTruthy();
    expect(screen.getByText('RDSInstance')).toBeTruthy();
  });

  test('shows empty pipeline message when pipeline is empty', () => {
    const comp = makeComposition({ mode: 'Pipeline', pipeline: [] });
    vi.mocked(Composition.useGet).mockReturnValue([comp, null]);
    render(<CompositionDetail />);
    expect(screen.getByText('No pipeline steps defined')).toBeTruthy();
  });
});
