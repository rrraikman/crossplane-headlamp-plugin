import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  Provider: { useGet: vi.fn().mockReturnValue([null, null]) },
  ProviderRevision: { useGet: vi.fn().mockReturnValue([null, null]) },
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
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ name: 'my-provider' }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));
vi.mock('../components/EventsTable', () => ({ EventsTable: () => null }));

import { Provider, ProviderRevision } from '../resources';
import { ProviderDetail } from './ProviderDetail';

function makeProvider(conditionOverrides: any[] = []) {
  return {
    jsonData: {
      spec: { package: 'xpkg.upbound.io/my-provider:v1.0.0' },
      status: {
        currentRevision: 'my-provider-abc123',
        conditions: conditionOverrides.length
          ? conditionOverrides
          : [
              { type: 'Installed', status: 'True', reason: 'ActivePackageRevision', message: '' },
              { type: 'Healthy', status: 'True', reason: 'Available', message: '' },
            ],
      },
      metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
    },
    metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
  };
}

describe('ProviderDetail', () => {
  test('shows loader while provider is loading', () => {
    vi.mocked(Provider.useGet).mockReturnValue([null, null]);
    render(<ProviderDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('renders package and revision when loaded', () => {
    vi.mocked(Provider.useGet).mockReturnValue([makeProvider(), null]);
    vi.mocked(ProviderRevision.useGet).mockReturnValue([null, null]);
    render(<ProviderDetail />);
    expect(screen.getByText('xpkg.upbound.io/my-provider:v1.0.0')).toBeTruthy();
    expect(screen.getByText('my-provider-abc123')).toBeTruthy();
  });

  test('shows Healthy chip when installed and healthy', () => {
    vi.mocked(Provider.useGet).mockReturnValue([makeProvider(), null]);
    vi.mocked(ProviderRevision.useGet).mockReturnValue([null, null]);
    render(<ProviderDetail />);
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  test('shows Unhealthy chip when installed but not healthy', () => {
    const provider = makeProvider([
      { type: 'Installed', status: 'True', reason: 'ActivePackageRevision', message: '' },
      { type: 'Healthy', status: 'False', reason: 'Degraded', message: '' },
    ]);
    vi.mocked(Provider.useGet).mockReturnValue([provider, null]);
    vi.mocked(ProviderRevision.useGet).mockReturnValue([null, null]);
    render(<ProviderDetail />);
    expect(screen.getByText('Unhealthy')).toBeTruthy();
  });

  test('shows revision section when revision is loaded', () => {
    const revision = {
      jsonData: {
        spec: { package: 'xpkg.upbound.io/my-provider:v1.0.0', revision: 1, desiredState: 'Active' },
        status: { conditions: [] },
      },
    };
    vi.mocked(Provider.useGet).mockReturnValue([makeProvider(), null]);
    vi.mocked(ProviderRevision.useGet).mockReturnValue([revision, null]);
    render(<ProviderDetail />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
});
