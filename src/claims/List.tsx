import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { CompositeResourceDefinition } from '../resources';
import { age, getReferenceableVersion, rawConditionStatus, StatusChip } from '../utils';
import { ClaimRow, sortByReady } from './List.utils';

export function ClaimList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);

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
      <SimpleTable
        columns={[
          { label: 'Namespace', getter: (r: ClaimRow) => r.namespace },
          {
            label: 'Name',
            getter: (r: ClaimRow) => (
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
            ),
          },
          { label: 'Kind', getter: (r: ClaimRow) => r.kind },
          { label: 'Ready', getter: (r: ClaimRow) => <StatusChip status={r.ready} /> },
          { label: 'Synced', getter: (r: ClaimRow) => <StatusChip status={r.synced} /> },
          {
            label: 'Message',
            getter: (r: ClaimRow) =>
              r.message ? (
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
              ),
          },
          { label: 'Age', getter: (r: ClaimRow) => age(r.creationTimestamp) },
        ]}
        data={claims}
        emptyMessage={emptyMessage}
      />
    </SectionBox>
  );
}
