import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
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

import { ConditionsTable } from './ConditionsTable';

describe('ConditionsTable', () => {
  test('shows empty message when no conditions', () => {
    render(<ConditionsTable conditions={[]} />);
    expect(screen.getByText('No conditions reported')).toBeTruthy();
  });

  test('shows empty message when conditions is undefined', () => {
    render(<ConditionsTable conditions={undefined} />);
    expect(screen.getByText('No conditions reported')).toBeTruthy();
  });

  test('renders condition type and reason', () => {
    render(<ConditionsTable conditions={[
      { type: 'Ready', status: 'True', reason: 'Available', message: '' },
    ]} />);
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
  });

  test('renders dash when no message', () => {
    render(<ConditionsTable conditions={[
      { type: 'Synced', status: 'False', reason: 'ReconcileError', message: '' },
    ]} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
