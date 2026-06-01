import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@iconify/react', () => ({
  Icon: () => <span data-testid="icon" />,
}));

import { CrossplaneInfoButton } from './CrossplaneInfoDialog';

describe('CrossplaneInfoButton', () => {
  test('renders the info button', () => {
    render(<CrossplaneInfoButton />);
    expect(screen.getByTitle('About Crossplane concepts')).toBeTruthy();
  });

  test('dialog is not visible before button is clicked', () => {
    render(<CrossplaneInfoButton />);
    expect(screen.queryByText('Crossplane Concepts')).toBeNull();
  });

  test('opens the dialog when the button is clicked', () => {
    render(<CrossplaneInfoButton />);
    fireEvent.click(screen.getByTitle('About Crossplane concepts'));
    expect(screen.getByText('Crossplane Concepts')).toBeTruthy();
  });

  test('dialog contains troubleshooting and platform setup sections', () => {
    render(<CrossplaneInfoButton />);
    fireEvent.click(screen.getByTitle('About Crossplane concepts'));
    expect(screen.getAllByText('TROUBLESHOOTING').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PLATFORM SETUP').length).toBeGreaterThan(0);
  });

  test('dialog contains the relationship diagram SVG', () => {
    render(<CrossplaneInfoButton />);
    fireEvent.click(screen.getByTitle('About Crossplane concepts'));
    expect(document.querySelector('svg')).toBeTruthy();
  });
});
