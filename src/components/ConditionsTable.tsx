import { SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Tooltip, Typography } from '@mui/material';
import { age, StatusChip } from '../utils';

export function reasonColor(status: string): 'success' | 'error' | 'warning' {
  if (status === 'True') return 'success';
  if (status === 'False') return 'error';
  return 'warning';
}

export function ConditionsTable({ conditions }: { conditions: any[] | undefined }) {
  return (
    <SimpleTable
      columns={[
        { label: 'Type', getter: (c: any) => c.type },
        { label: 'Status', getter: (c: any) => <StatusChip status={c.status} /> },
        {
          label: 'Reason',
          getter: (c: any) =>
            c.reason ? (
              <Chip
                size="small"
                label={c.reason}
                color={reasonColor(c.status)}
                variant="outlined"
              />
            ) : (
              '—'
            ),
        },
        {
          label: 'Message',
          getter: (c: any) =>
            c.message ? (
              <Tooltip title={c.message} placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
                >
                  {c.message}
                </Typography>
              </Tooltip>
            ) : (
              '—'
            ),
        },
        {
          label: 'Last Transition',
          getter: (c: any) => (c.lastTransitionTime ? age(c.lastTransitionTime) : '—'),
        },
      ]}
      data={conditions ?? []}
      emptyMessage="No conditions reported"
    />
  );
}
