import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test } from 'vitest';
import { facetColumn, namespaceColumn, statusColumn } from './tableColumns';

describe('statusColumn', () => {
  const col = statusColumn('Ready', (r: { s: string }) => r.s);

  test('is a multi-select facet over the status string', () => {
    expect(col.filterVariant).toBe('multi-select');
    expect(col.accessorFn({ s: 'False' })).toBe('False');
  });

  test('renders a status chip', () => {
    render(<>{col.Cell({ row: { original: { s: 'True' } } })}</>);
    expect(screen.getByText('True')).toBeTruthy();
  });
});

describe('namespaceColumn', () => {
  const col = namespaceColumn((r: { ns?: string }) => r.ns);

  test('shows a dash for cluster-scoped rows so the facet has a value', () => {
    expect(col.accessorFn({})).toBe('—');
    expect(col.accessorFn({ ns: 'prod' })).toBe('prod');
    expect(col.filterVariant).toBe('multi-select');
  });
});

describe('facetColumn', () => {
  test('uses the header and falls back to a dash', () => {
    const col = facetColumn('Kind', (r: { k?: string }) => r.k);
    expect(col.header).toBe('Kind');
    expect(col.accessorFn({ k: '' })).toBe('—');
    expect(col.accessorFn({ k: 'Bucket' })).toBe('Bucket');
  });
});
