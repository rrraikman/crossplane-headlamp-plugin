import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  BackLink: () => null,
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
  NameValueTable: ({ rows }: { rows: { name: string; value: any }[] }) => (
    <dl>{rows.map(r => <div key={r.name}><dt>{r.name}</dt><dd>{r.value}</dd></div>)}</dl>
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
  Link: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({
    group: 'nopesql.crossplane.io',
    version: 'v1alpha1',
    plural: 'nosqldbs',
    kind: 'NoSQLDB',
  }),
}));

import { KubeObject } from '../__mocks__/headlamp-k8s-cluster';
import { ManagedResourceTypeList } from './TypeList';

function makeMRInstance(name: string) {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: { status: { conditions: [] }, metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' } },
  };
}

describe('ManagedResourceTypeList', () => {
  test('shows loader while list is loading', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([null, null]);
    render(<ManagedResourceTypeList />);
    expect(screen.getByText('Loading NoSQLDB resources...')).toBeTruthy();
  });

  test('shows empty message when no instances exist', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[], null]);
    render(<ManagedResourceTypeList />);
    expect(screen.getByText(/No NoSQLDB instances have been created yet/)).toBeTruthy();
  });

  test('shows instance names in the table', () => {
    vi.mocked(KubeObject.useList).mockReturnValue([[makeMRInstance('db-instance-1')], null]);
    render(<ManagedResourceTypeList />);
    expect(screen.getByText('db-instance-1')).toBeTruthy();
  });
});
