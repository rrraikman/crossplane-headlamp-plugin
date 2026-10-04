import { StatusChip } from '../utils';

// Categorical columns get Headlamp's multi-select facet filter (the same
// variant ResourceTable uses for namespaces). Tables using these must pass
// enableFacetedValues so the dropdown is populated from the data.

export function statusColumn<T>(header: string, getStatus: (row: T) => string) {
  return {
    header,
    accessorFn: getStatus,
    filterVariant: 'multi-select' as const,
    Cell: ({ row }: { row: { original: T } }) => <StatusChip status={getStatus(row.original)} />,
  };
}

export function namespaceColumn<T>(getNamespace: (row: T) => string | undefined) {
  return {
    header: 'Namespace',
    accessorFn: (row: T) => getNamespace(row) || '—',
    filterVariant: 'multi-select' as const,
  };
}

export function facetColumn<T>(header: string, get: (row: T) => string | undefined) {
  return {
    header,
    accessorFn: (row: T) => get(row) || '—',
    filterVariant: 'multi-select' as const,
  };
}
