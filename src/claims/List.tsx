import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  SectionFilterHeader,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';
import { facetColumn, namespaceColumn, statusColumn } from '../components/tableColumns';
import { CompositeResourceDefinition } from '../resources';
import { age, debugMessage, rawConditionStatus } from '../utils';
import { useXRDInstanceLists } from '../xrdInstances';
import { ClaimRow, sortByReady } from './List.utils';

export function ClaimList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const { watchers, lists } = useXRDInstanceLists(xrds, 'claim');
  const filterFunction = useFilterFunc<ClaimRow>();

  // Only XRDs that expose a claim type matter here.
  const claimXrds = useMemo(
    () => xrds?.filter(x => !!x.jsonData.spec.claimNames?.plural) ?? null,
    [xrds]
  );

  const claims = useMemo(
    () =>
      lists &&
      sortByReady(
        lists.flatMap(({ group, version, plural, kind, items }) =>
          items.map((item: any): ClaimRow => {
            const conditions: any[] = item.status?.conditions ?? [];
            return {
              name: item.metadata.name,
              namespace: item.metadata.namespace ?? '—',
              kind,
              group,
              version,
              plural,
              ready: rawConditionStatus(conditions, 'Ready'),
              synced: rawConditionStatus(conditions, 'Synced'),
              message: debugMessage(conditions),
              creationTimestamp: item.metadata.creationTimestamp,
              metadata: { name: item.metadata.name, namespace: item.metadata.namespace },
            };
          })
        )
      ),
    [lists]
  );

  if (!xrds || claims === null) {
    return (
      <>
        {watchers}
        <Loader title="Loading claims..." />
      </>
    );
  }

  // Filter here (not via Table's filterFunction) so the title count matches the namespace picker.
  const visibleClaims = claims.filter(c => filterFunction(c));

  const emptyMessage =
    claimXrds?.length === 0
      ? 'No XRDs in this cluster define a claim type'
      : `No claim instances found across ${claimXrds?.length} claim type(s): ${claimXrds?.map(x => x.jsonData.spec.claimNames.kind).join(', ')}`;

  return (
    <>
      {watchers}
      <SectionBox title={<SectionFilterHeader title={`Claims (${visibleClaims.length})`} />}>
        {claimXrds && claimXrds.length > 0 && claims.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {claimXrds.length} claim type(s) available:{' '}
            {claimXrds.map(x => x.jsonData.spec.claimNames.kind).join(', ')}
          </Typography>
        )}
        <Table
          columns={[
            namespaceColumn((r: ClaimRow) => r.metadata.namespace),
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
            facetColumn('Kind', (r: ClaimRow) => r.kind),
            statusColumn('Ready', (r: ClaimRow) => r.ready),
            statusColumn('Synced', (r: ClaimRow) => r.synced),
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
          data={visibleClaims}
          enableFacetedValues
          emptyMessage={emptyMessage}
        />
      </SectionBox>
    </>
  );
}
