import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  Provider: { useList: vi.fn().mockReturnValue([null, null]) },
  Configuration: { useList: vi.fn().mockReturnValue([null, null]) },
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

import { Configuration, Provider } from '../resources';
import { PackageList } from './List';

function makeProvider(name: string) {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      spec: { package: `xpkg.upbound.io/${name}:v1` },
      status: { conditions: [{ type: 'Installed', status: 'True' }, { type: 'Healthy', status: 'True' }] },
    },
  };
}

describe('PackageList', () => {
  test('shows empty message when no providers', () => {
    vi.mocked(Provider.useList).mockReturnValue([[], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[], null]);
    render(<PackageList />);
    expect(screen.getByText('No providers found')).toBeTruthy();
    expect(screen.getByText('No configurations found')).toBeTruthy();
  });

  test('renders provider names in the table', () => {
    vi.mocked(Provider.useList).mockReturnValue([[makeProvider('provider-aws'), makeProvider('provider-gcp')], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[], null]);
    render(<PackageList />);
    expect(screen.getByText('provider-aws')).toBeTruthy();
    expect(screen.getByText('provider-gcp')).toBeTruthy();
  });

  test('renders configuration names in the table', () => {
    vi.mocked(Provider.useList).mockReturnValue([[], null]);
    vi.mocked(Configuration.useList).mockReturnValue([[makeProvider('platform-config')], null]);
    render(<PackageList />);
    expect(screen.getByText('platform-config')).toBeTruthy();
  });
});
