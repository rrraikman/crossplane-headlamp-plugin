import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test } from 'vitest';
import { CrossplaneInfoButton } from './CrossplaneInfoDialog';

describe('CrossplaneInfoButton', () => {
  test('renders the info button', () => {
    const { container } = render(<CrossplaneInfoButton />);
    expect(container.querySelector('button')).toBeTruthy();
  });

  test('opens dialog when button is clicked', () => {
    render(<CrossplaneInfoButton />);
    fireEvent.click(screen.getByTitle('About Crossplane concepts'));
    expect(screen.getByText('Crossplane Concepts')).toBeTruthy();
  });
});
