import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

import { ReconcileButton } from './ReconcileButton';

describe('ReconcileButton', () => {
  test('renders in idle state', () => {
    render(<ReconcileButton resource={{ patch: vi.fn() }} />);
    expect(screen.getByRole('button', { name: 'Trigger reconcile' })).toBeTruthy();
  });

  test('patches the resource with a reconcile annotation on click', async () => {
    const patch = vi.fn().mockResolvedValue({});
    render(<ReconcileButton resource={{ patch }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger reconcile' }));
    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith({
        metadata: { annotations: { 'swefarm.com/reconcile-requested-at': expect.any(String) } },
      });
    });
  });

  test('shows success state after a successful patch', async () => {
    const patch = vi.fn().mockResolvedValue({});
    render(<ReconcileButton resource={{ patch }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger reconcile' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reconcile triggered' })).toBeTruthy();
    });
  });

  test('shows error state when the patch fails', async () => {
    const patch = vi.fn().mockRejectedValue(new Error('boom'));
    render(<ReconcileButton resource={{ patch }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger reconcile' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Failed to trigger reconcile' })).toBeTruthy();
    });
  });
});
