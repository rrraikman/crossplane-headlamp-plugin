import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { age } from '../utils';

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

  const sorted = events
    ? [...events].sort((a, b) => {
        const aTime = a.lastTimestamp ?? a.eventTime ?? '';
        const bTime = b.lastTimestamp ?? b.eventTime ?? '';
        return bTime.localeCompare(aTime);
      })
    : null;

  if (events?.length === 0) return null;

  return (
    <SectionBox title={`Events (${events?.length ?? '…'})`}>
      <SimpleTable
        columns={[
          {
            label: 'Type',
            getter: (e: any) => (
              <Chip
                size="small"
                label={e.type}
                color={e.type === 'Warning' ? 'warning' : 'success'}
                variant="outlined"
              />
            ),
          },
          { label: 'Reason', getter: (e: any) => e.reason },
          {
            label: 'Message',
            getter: (e: any) => (
              <Tooltip title={e.message} placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: 520, cursor: 'default', fontFamily: 'monospace' }}
                >
                  {e.message}
                </Typography>
              </Tooltip>
            ),
          },
          { label: 'Count', getter: (e: any) => e.count ?? 1 },
          {
            label: 'Age',
            getter: (e: any) =>
              age(e.lastTimestamp ?? e.eventTime ?? e.metadata.creationTimestamp),
          },
        ]}
        data={sorted}
        emptyMessage="No events found"
      />
    </SectionBox>
  );
}
