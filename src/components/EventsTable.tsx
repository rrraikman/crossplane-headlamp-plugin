import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Chip, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { age } from '../utils';
import { sortEvents } from './EventsTable.utils';

export function EventsTable({
  resourceName,
  resourceKind,
  namespace,
}: {
  resourceName: string;
  resourceKind?: string;
  namespace?: string;
}) {
  const [events, setEvents] = useState<any[] | null>(null);
  const filterFunction = useFilterFunc();

  useEffect(() => {
    const parts = [`involvedObject.name=${resourceName}`];
    if (resourceKind) parts.push(`involvedObject.kind=${resourceKind}`);
    const fieldSelector = encodeURIComponent(parts.join(','));

    const url = namespace
      ? `/api/v1/namespaces/${namespace}/events?fieldSelector=${fieldSelector}`
      : `/api/v1/events?fieldSelector=${fieldSelector}`;

    request(url)
      .then((data: any) => setEvents(data.items ?? []))
      .catch(() => setEvents([]));
  }, [resourceName, resourceKind, namespace]);

  const sorted = events ? sortEvents(events) : null;

  return (
    <SectionBox title={`Events (${events?.length ?? '…'})`}>
      <Table
        columns={[
          {
            header: 'Type',
            accessorFn: (e: any) => e.type,
            Cell: ({ row }: any) => (
              <Chip
                size="small"
                label={row.original.type}
                color={row.original.type === 'Warning' ? 'warning' : 'success'}
                variant="outlined"
              />
            ),
          },
          { header: 'Reason', accessorFn: (e: any) => e.reason },
          {
            header: 'Message',
            accessorFn: (e: any) => e.message,
            Cell: ({ row }: any) => (
              <Tooltip title={row.original.message} placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: 520, cursor: 'default', fontFamily: 'monospace' }}
                >
                  {row.original.message}
                </Typography>
              </Tooltip>
            ),
          },
          { header: 'Count', accessorFn: (e: any) => e.count ?? 1 },
          {
            header: 'Age',
            accessorFn: (e: any) =>
              age(e.lastTimestamp ?? e.eventTime ?? e.metadata.creationTimestamp),
          },
        ]}
        data={sorted ?? []}
        loading={sorted === null}
        filterFunction={filterFunction}
        emptyMessage="No recent events"
      />
    </SectionBox>
  );
}
