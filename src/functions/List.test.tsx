import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  CrossplaneFunction: { useList: vi.fn().mockReturnValue([null, null]) },
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

import { CrossplaneFunction } from '../resources';
import { FunctionList } from './List';

function makeFn(name: string) {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: {
      spec: { package: `xpkg.upbound.io/crossplane-contrib/${name}:v0.6.0` },
      status: { conditions: [{ type: 'Installed', status: 'True' }, { type: 'Healthy', status: 'True' }] },
    },
  };
}

describe('FunctionList', () => {
  test('shows empty message when no functions', () => {
    vi.mocked(CrossplaneFunction.useList).mockReturnValue([[], null]);
    render(<FunctionList />);
    expect(screen.getByText('No functions found')).toBeTruthy();
  });

  test('renders function names', () => {
    vi.mocked(CrossplaneFunction.useList).mockReturnValue([
      [makeFn('function-patch-and-transform'), makeFn('function-go-templating')],
      null,
    ]);
    render(<FunctionList />);
    expect(screen.getByText('function-patch-and-transform')).toBeTruthy();
    expect(screen.getByText('function-go-templating')).toBeTruthy();
  });
});
