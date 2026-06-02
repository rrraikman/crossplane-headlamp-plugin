import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

import { SchemaTree } from './SchemaTree';

describe('SchemaTree', () => {
  test('shows "No schema defined" when schema is null', () => {
    render(<SchemaTree schema={null} />);
    expect(screen.getByText('No schema defined')).toBeTruthy();
  });

  test('shows "No properties defined" when schema has no properties', () => {
    render(<SchemaTree schema={{ type: 'object' }} />);
    expect(screen.getByText('No properties defined')).toBeTruthy();
  });

  test('renders root property names', () => {
    const schema = {
      type: 'object',
      properties: {
        spec: { type: 'object' },
        status: { type: 'object' },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('spec')).toBeTruthy();
    expect(screen.getByText('status')).toBeTruthy();
  });

  test('renders type chips for each property', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        count: { type: 'integer' },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('string')).toBeTruthy();
    expect(screen.getByText('integer')).toBeTruthy();
  });

  test('renders description text', () => {
    const schema = {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'AWS region for the resource' },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('AWS region for the resource')).toBeTruthy();
  });

  test('renders required chip for required properties', () => {
    const schema = {
      type: 'object',
      required: ['region'],
      properties: {
        region: { type: 'string' },
        tags: { type: 'object' },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('required')).toBeTruthy();
  });

  test('renders chevron-down for expandable properties (open by default at depth 0)', () => {
    const schema = {
      type: 'object',
      properties: {
        spec: {
          type: 'object',
          properties: { region: { type: 'string' } },
        },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getAllByTestId('icon-mdi:chevron-down').length).toBeGreaterThan(0);
  });

  test('collapses a section when the chevron is clicked', async () => {
    const schema = {
      type: 'object',
      properties: {
        spec: {
          type: 'object',
          properties: { region: { type: 'string' } },
        },
      },
    };
    const user = userEvent.setup();
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('region')).toBeTruthy();
    await user.click(screen.getAllByRole('button')[0]);
    expect(screen.queryByText('icon-mdi:chevron-right')).toBeNull();
  });

  test('renders array item properties', () => {
    const schema = {
      type: 'object',
      properties: {
        ports: {
          type: 'array',
          items: {
            type: 'object',
            properties: { port: { type: 'integer' }, protocol: { type: 'string' } },
          },
        },
      },
    };
    render(<SchemaTree schema={schema} />);
    expect(screen.getByText('ports')).toBeTruthy();
    expect(screen.getByText('array')).toBeTruthy();
  });
});
