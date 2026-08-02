import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { CompositeResourceDefinition } from '../resources';
import { age, getReferenceableVersion, rawConditionStatus, StatusChip } from '../utils';
import { ClaimRow, sortByReady } from './List.utils';

export function ClaimList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const filterFunction = useFilterFunc<ClaimRow>();

  // Only XRDs that expose a claim type matter here.
  const claimXrds = useMemo(
    () => xrds?.filter(x => !!x.jsonData.spec.claimNames?.plural) ?? null,
    [xrds]
  );

  const xrdsKey = useMemo(
    () => claimXrds?.map(x => x.metadata.name).sort().join(',') ?? '',
    [claimXrds]
  );

  useEffect(() => {
    if (!claimXrds) return;
    if (claimXrds.length === 0) {
      setClaims([]);
      return;
    }

    Promise.all(
      claimXrds.map(xrd => {
        const spec = xrd.jsonData.spec;
        const group = spec.group;
        const version = getReferenceableVersion(spec);
        const plural = spec.claimNames.plural;
        const kind = spec.claimNames.kind;

        return request(`/apis/${group}/${version}/${plural}`)
          .then((data: any) =>
            (data.items ?? []).map((item: any): ClaimRow => {
              const conditions: any[] = item.status?.conditions ?? [];
              const failing = conditions.find(
                (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
              );
              return {
                name: item.metadata.name,
                namespace: item.metadata.namespace ?? '—',
                kind,
                group,
                version,
                plural,
                ready: rawConditionStatus(conditions, 'Ready'),
                synced: rawConditionStatus(conditions, 'Synced'),
                message: failing?.message ?? null,
                creationTimestamp: item.metadata.creationTimestamp,
              };
            })
          )
          .catch(() => [] as ClaimRow[]);
      })
    ).then(results => setClaims(sortByReady(results.flat())));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  if (!xrds || claims === null) return <Loader title="Loading claims..." />;

  const emptyMessage =
    claimXrds?.length === 0
      ? 'No XRDs in this cluster define a claim type'
      : `No claim instances found across ${claimXrds?.length} claim type(s): ${claimXrds?.map(x => x.jsonData.spec.claimNames.kind).join(', ')}`;

  return (
    <SectionBox title={`Claims (${claims.length})`}>
      {claimXrds && claimXrds.length > 0 && claims.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {claimXrds.length} claim type(s) available:{' '}
          {claimXrds.map(x => x.jsonData.spec.claimNames.kind).join(', ')}
        </Typography>
      )}
      <Table
        columns={[
          { header: 'Namespace', accessorFn: (r: ClaimRow) => r.namespace },
          {
            header: 'Name',
            accessorFn: (r: ClaimRow) => r.name,
            Cell: ({ row }: any) => {
              const r: ClaimRow = row.original;
              return (
                <HeadlampLink
                  routeName="crossplane-claim-detail"
                  params={{
                    group: r.group,
                    version: r.version,
                    plural: r.plural,
                    namespace: r.namespace,
                    name: r.name,
                  }}
                >
                  {r.name}
                </HeadlampLink>
              );
            },
          },
          { header: 'Kind', accessorFn: (r: ClaimRow) => r.kind },
          {
            header: 'Ready',
            accessorFn: (r: ClaimRow) => r.ready,
            Cell: ({ row }: any) => <StatusChip status={row.original.ready} />,
          },
          {
            header: 'Synced',
            accessorFn: (r: ClaimRow) => r.synced,
            Cell: ({ row }: any) => <StatusChip status={row.original.synced} />,
          },
          {
            header: 'Message',
            accessorFn: (r: ClaimRow) => r.message ?? '—',
            Cell: ({ row }: any) => {
              const r: ClaimRow = row.original;
              return r.message ? (
                <HeadlampLink
                  routeName="crossplane-claim-detail"
                  params={{
                    group: r.group,
                    version: r.version,
                    plural: r.plural,
                    namespace: r.namespace,
                    name: r.name,
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  <Tooltip title={r.message} placement="top-start">
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ maxWidth: 480, cursor: 'pointer', fontFamily: 'monospace', color: 'error.main' }}
                    >
                      {r.message}
                    </Typography>
                  </Tooltip>
                </HeadlampLink>
              ) : (
                '—'
              );
            },
          },
          { header: 'Age', accessorFn: (r: ClaimRow) => age(r.creationTimestamp) },
        ]}
        data={claims}
        filterFunction={filterFunction}
        emptyMessage={emptyMessage}
      />
    </SectionBox>
  );
}
