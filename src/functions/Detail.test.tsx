import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  CrossplaneFunction: { useGet: vi.fn().mockReturnValue([null, null]) },
  CrossplaneFunctionRevision: { useGet: vi.fn().mockReturnValue([null, null]) },
  Composition: { useList: vi.fn().mockReturnValue([[], null]) },
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
  useParams: vi.fn().mockReturnValue({ name: 'function-patch-and-transform' }),
}));

vi.mock('../components/ConditionsTable', () => ({ ConditionsTable: () => null }));
vi.mock('../components/EventsTable', () => ({ EventsTable: () => null }));

import { Composition, CrossplaneFunction, CrossplaneFunctionRevision } from '../resources';
import { FunctionDetail } from './Detail';

function makeFn(conditionOverrides: any[] = []) {
  return {
    jsonData: {
      spec: { package: 'xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.6.0' },
      status: {
        currentRevision: 'fn-pat-abc',
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

describe('FunctionDetail', () => {
  test('shows loader while function is loading', () => {
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([null, null]);
    render(<FunctionDetail />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  test('renders package and revision when loaded', () => {
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([makeFn(), null]);
    vi.mocked(CrossplaneFunctionRevision.useGet).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<FunctionDetail />);
    expect(screen.getByText('xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.6.0')).toBeTruthy();
    expect(screen.getByText('fn-pat-abc')).toBeTruthy();
  });

  test('shows Healthy chip when installed and healthy', () => {
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([makeFn(), null]);
    vi.mocked(CrossplaneFunctionRevision.useGet).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<FunctionDetail />);
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  test('shows Unhealthy chip when not healthy', () => {
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([makeFn([
      { type: 'Installed', status: 'True', reason: 'ActivePackageRevision', message: '' },
      { type: 'Healthy', status: 'False', reason: 'Degraded', message: '' },
    ]), null]);
    vi.mocked(CrossplaneFunctionRevision.useGet).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<FunctionDetail />);
    expect(screen.getByText('Unhealthy')).toBeTruthy();
  });

  test('shows referencing compositions', () => {
    const comp = {
      metadata: { name: 'my-composition', creationTimestamp: '2024-01-01T00:00:00Z' },
      jsonData: {
        spec: {
          compositeTypeRef: { kind: 'XDatabase', apiVersion: 'example.io/v1' },
          pipeline: [{ step: 'pat', functionRef: { name: 'function-patch-and-transform' } }],
        },
      },
    };
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([makeFn(), null]);
    vi.mocked(CrossplaneFunctionRevision.useGet).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[comp], null]);
    render(<FunctionDetail />);
    expect(screen.getByText('my-composition')).toBeTruthy();
  });

  test('shows no compositions message when none reference the function', () => {
    vi.mocked(CrossplaneFunction.useGet).mockReturnValue([makeFn(), null]);
    vi.mocked(CrossplaneFunctionRevision.useGet).mockReturnValue([null, null]);
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<FunctionDetail />);
    expect(screen.getByText('No compositions reference this function')).toBeTruthy();
  });
});
