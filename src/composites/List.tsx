import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useEffect, useMemo, useState } from 'react';
import { CompositeResourceDefinition } from '../resources';
import { age, getReferenceableVersion, rawConditionStatus, StatusChip } from '../utils';
import { sortByReady,XRRow } from './List.utils';

export function CompositeResourceList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const [xrs, setXrs] = useState<XRRow[] | null>(null);
  const filterFunction = useFilterFunc<XRRow>();

  const xrdsKey = useMemo(
    () => xrds?.map(x => x.metadata.name).sort().join(',') ?? '',
    [xrds]
  );

  useEffect(() => {
    if (!xrds) return;
    if (xrds.length === 0) {
      setXrs([]);
      return;
    }

    Promise.all(
      xrds.map(xrd => {
        const spec = xrd.jsonData.spec;
        const group = spec.group;
        const version = getReferenceableVersion(spec);
        const plural = spec.names.plural;
        const kind = spec.names.kind;

        return request(`/apis/${group}/${version}/${plural}`)
          .then((data: any) =>
            (data.items ?? []).map((item: any): XRRow => ({
              name: item.metadata.name,
              kind,
              group,
              version,
              plural,
              ready: rawConditionStatus(item.status?.conditions ?? [], 'Ready'),
              synced: rawConditionStatus(item.status?.conditions ?? [], 'Synced'),
              creationTimestamp: item.metadata.creationTimestamp,
            }))
          )
          .catch(() => [] as XRRow[]);
      })
    ).then(results => setXrs(sortByReady(results.flat())));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  if (!xrds || xrs === null) return <Loader title="Loading composite resources..." />;

  return (
    <SectionBox title={`Composite Resources (${xrs.length})`}>
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (r: XRRow) => r.name,
            Cell: ({ row }: any) => (
              <HeadlampLink
                routeName="crossplane-composite-detail"
                params={{ group: row.original.group, version: row.original.version, plural: row.original.plural, name: row.original.name }}
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
  );
}
