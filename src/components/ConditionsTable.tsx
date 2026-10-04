import { Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Tooltip, Typography } from '@mui/material';
import { age } from '../utils';
import { facetColumn, statusColumn } from './tableColumns';

export function reasonColor(status: string): 'success' | 'error' | 'warning' {
  if (status === 'True') return 'success';
  if (status === 'False') return 'error';
  return 'warning';
}

export function ConditionsTable({ conditions }: { conditions: any[] | undefined }) {

  return (
    <Table
      columns={[
        facetColumn('Type', (c: any) => c.type),
        statusColumn('Status', (c: any) => c.status),
        {
          header: 'Reason',
          accessorFn: (c: any) => c.reason ?? '—',
          Cell: ({ row }: any) =>
            row.original.reason ? (
              <Chip
                size="small"
                label={row.original.reason}
                color={reasonColor(row.original.status)}
                variant="outlined"
              />
            ) : (
              '—'
            ),
        },
        {
          header: 'Message',
          accessorFn: (c: any) => c.message ?? '—',
          Cell: ({ row }: any) =>
            row.original.message ? (
              <Tooltip title={row.original.message} placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
                >
                  {row.original.message}
                </Typography>
              </Tooltip>
            ) : (
              '—'
            ),
        },
        {
          header: 'Last Transition',
          accessorFn: (c: any) => (c.lastTransitionTime ? age(c.lastTransitionTime) : '—'),
        },
      ]}
      data={conditions ?? []}
      enableFacetedValues
      emptyMessage="No conditions reported"
    />
  );
}
