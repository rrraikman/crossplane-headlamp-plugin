import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  SectionFilterHeader,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useMemo } from 'react';
import { facetColumn, namespaceColumn, statusColumn } from '../components/tableColumns';
import { detailRouteParams } from '../discovery';
import { CompositeResourceDefinition } from '../resources';
import { age, rawConditionStatus } from '../utils';
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
              metadata: { name: item.metadata.name, namespace: item.metadata.namespace },
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
  // Filter here (not via Table's filterFunction) so the title count matches the namespace picker.
  const visibleXrs = xrs.filter(r => filterFunction(r));

  return (
    <>
      {watchers}
      <SectionBox
        title={<SectionFilterHeader title={`Composite Resources (${visibleXrs.length})`} />}
      >
        <Table
          columns={[
            ...(anyNamespaced ? [namespaceColumn((r: XRRow) => r.namespace)] : []),
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
            facetColumn('Kind', (r: XRRow) => r.kind),
            statusColumn('Ready', (r: XRRow) => r.ready),
            statusColumn('Synced', (r: XRRow) => r.synced),
            { header: 'Age', accessorFn: (r: XRRow) => age(r.creationTimestamp) },
          ]}
          data={visibleXrs}
          enableFacetedValues
          emptyMessage="No composite resources found"
        />
      </SectionBox>
    </>
  );
}
