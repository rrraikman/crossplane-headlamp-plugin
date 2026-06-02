import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
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

import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { EventsTable } from './EventsTable';

describe('EventsTable', () => {
  test('shows empty message when no events returned', async () => {
    vi.mocked(request).mockResolvedValue({ items: [] });
    render(<EventsTable resourceName="my-xdb" resourceKind="XDatabase" />);
    await waitFor(() => {
      expect(screen.getByText('No recent events')).toBeTruthy();
    });
  });

  test('shows event reason when events exist', async () => {
    vi.mocked(request).mockResolvedValue({
      items: [{
        type: 'Normal',
        reason: 'ReconcileSuccess',
        message: 'Reconcile succeeded',
        count: 3,
        metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
        lastTimestamp: '2024-01-01T00:00:00Z',
      }],
    });
    render(<EventsTable resourceName="my-xdb" resourceKind="XDatabase" />);
    await waitFor(() => {
      expect(screen.getByText('ReconcileSuccess')).toBeTruthy();
    });
  });
});
