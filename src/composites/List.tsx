import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useMemo } from 'react';
import { detailRouteParams } from '../discovery';
import { CompositeResourceDefinition } from '../resources';
import { age, rawConditionStatus, StatusChip } from '../utils';
import { useXRDInstanceLists } from '../xrdInstances';
import { sortByReady, XRRow } from './List.utils';

export function CompositeResourceList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const { watchers, lists } = useXRDInstanceLists(xrds, 'composite');
  const filterFunction = useFilterFunc<XRRow>();

  const xrs = useMemo(
    () =>
      lists &&
      sortByReady(
        lists.flatMap(({ group, version, plural, kind, items }) =>
          items.map(
            (item: any): XRRow => ({
              name: item.metadata.name,
              namespace: item.metadata.namespace,
              kind,
              group,
              version,
              plural,
              ready: rawConditionStatus(item.status?.conditions ?? [], 'Ready'),
              synced: rawConditionStatus(item.status?.conditions ?? [], 'Synced'),
              creationTimestamp: item.metadata.creationTimestamp,
            })
          )
        )
      ),
    [lists]
  );

  if (!xrds || xrs === null) {
    return (
      <>
        {watchers}
        <Loader title="Loading composite resources..." />
      </>
    );
  }

  const anyNamespaced = xrs.some(r => r.namespace);

  return (
    <>
      {watchers}
      <SectionBox title={`Composite Resources (${xrs.length})`}>
        <Table
          columns={[
            ...(anyNamespaced
              ? [{ header: 'Namespace', accessorFn: (r: XRRow) => r.namespace ?? '—' }]
              : []),
            {
              header: 'Name',
              accessorFn: (r: XRRow) => r.name,
              Cell: ({ row }: any) => (
                <HeadlampLink
                  routeName="crossplane-composite-detail"
                  params={detailRouteParams(
                    `${row.original.group}/${row.original.version}`,
                    row.original.plural,
                    row.original.name,
                    row.original.namespace
                  )}
                >
                  {row.original.name}
                </HeadlampLink>
              ),
            },
            { header: 'Kind', accessorFn: (r: XRRow) => r.kind },
            {
              header: 'Ready',
              accessorFn: (r: XRRow) => r.ready,
              Cell: ({ row }: any) => <StatusChip status={row.original.ready} />,
            },
            {
              header: 'Synced',
              accessorFn: (r: XRRow) => r.synced,
              Cell: ({ row }: any) => <StatusChip status={row.original.synced} />,
            },
            { header: 'Age', accessorFn: (r: XRRow) => age(r.creationTimestamp) },
          ]}
          data={xrs}
          filterFunction={filterFunction}
          emptyMessage="No composite resources found"
        />
      </SectionBox>
    </>
  );
}
