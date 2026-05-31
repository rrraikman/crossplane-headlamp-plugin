import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../resources', () => ({
  Composition: { useList: vi.fn().mockReturnValue([null, null]) },
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

import { Composition } from '../resources';
import { CompositionList } from './List';

function makeComposition(name: string, kind = 'XDatabase', mode = 'Resources') {
  return {
    metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z' },
    jsonData: { spec: { compositeTypeRef: { kind }, mode } },
  };
}

describe('CompositionList', () => {
  test('shows empty message when no compositions', () => {
    vi.mocked(Composition.useList).mockReturnValue([[], null]);
    render(<CompositionList />);
    expect(screen.getByText('No compositions found')).toBeTruthy();
  });

  test('renders composition names', () => {
    vi.mocked(Composition.useList).mockReturnValue([
      [makeComposition('xdatabase-composition'), makeComposition('xnetwork-composition', 'XNetwork')],
      null,
    ]);
    render(<CompositionList />);
    expect(screen.getByText('xdatabase-composition')).toBeTruthy();
    expect(screen.getByText('xnetwork-composition')).toBeTruthy();
  });

  test('renders composite type and mode columns', () => {
    vi.mocked(Composition.useList).mockReturnValue([[makeComposition('my-comp', 'XApp', 'Pipeline')], null]);
    render(<CompositionList />);
    expect(screen.getByText('XApp')).toBeTruthy();
    expect(screen.getByText('Pipeline')).toBeTruthy();
  });
});
