import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  Configuration: { useGet: vi.fn().mockReturnValue([null, null]) },
  ConfigurationRevision: { useGet: vi.fn().mockReturnValue([null, null]) },
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
  useParams: vi.fn().mockReturnValue({ name: 'my-config' }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));

import { Configuration, ConfigurationRevision } from '../resources';
import { ConfigurationDetail } from './ConfigurationDetail';

function makeConfiguration(conditionOverrides: any[] = []) {
  return {
    jsonData: {
      spec: { package: 'xpkg.upbound.io/my-config:v1.0.0' },
      status: {
        currentRevision: 'my-config-abc123',
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

describe('ConfigurationDetail', () => {
  test('shows loader while configuration is loading', () => {
    vi.mocked(Configuration.useGet).mockReturnValue([null, null]);
    render(<ConfigurationDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('renders package and revision when loaded', () => {
    vi.mocked(Configuration.useGet).mockReturnValue([makeConfiguration(), null]);
    vi.mocked(ConfigurationRevision.useGet).mockReturnValue([null, null]);
    render(<ConfigurationDetail />);
    expect(screen.getByText('xpkg.upbound.io/my-config:v1.0.0')).toBeTruthy();
    expect(screen.getByText('my-config-abc123')).toBeTruthy();
  });

  test('shows Healthy chip when installed and healthy', () => {
    vi.mocked(Configuration.useGet).mockReturnValue([makeConfiguration(), null]);
    vi.mocked(ConfigurationRevision.useGet).mockReturnValue([null, null]);
    render(<ConfigurationDetail />);
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  test('shows Not Installed chip when not installed', () => {
    const config = makeConfiguration([
      { type: 'Installed', status: 'False', reason: 'InactivePackageRevision', message: '' },
    ]);
    vi.mocked(Configuration.useGet).mockReturnValue([config, null]);
    vi.mocked(ConfigurationRevision.useGet).mockReturnValue([null, null]);
    render(<ConfigurationDetail />);
    expect(screen.getByText('Not Installed')).toBeTruthy();
  });
});
