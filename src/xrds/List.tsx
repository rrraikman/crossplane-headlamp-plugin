import { Link as HeadlampLink, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { CompositeResourceDefinition } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function XRDList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const filterFunction = useFilterFunc();

  return (
    <SectionBox title="Composite Resource Definitions">
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (r: any) => r.metadata.name,
            Cell: ({ row }: any) => (
              <HeadlampLink routeName="crossplane-xrd-detail" params={{ name: row.original.metadata.name }}>
                {row.original.metadata.name}
              </HeadlampLink>
            ),
          },
          { header: 'Group', accessorFn: (r: any) => r.jsonData.spec?.group ?? '—' },
          {
            header: 'Versions',
            accessorFn: (r: any) =>
              r.jsonData.spec?.versions?.map((v: any) => v.name).join(', ') ?? '—',
          },
          { header: 'Composite Kind', accessorFn: (r: any) => r.jsonData.spec?.names?.kind ?? '—' },
          { header: 'Claim Kind', accessorFn: (r: any) => r.jsonData.spec?.claimNames?.kind ?? '—' },
          {
            header: 'Established',
            accessorFn: (r: any) => conditionStatus(r, 'Established'),
            Cell: ({ row }: any) => <StatusChip status={conditionStatus(row.original, 'Established')} />,
          },
          { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={xrds ?? []}
        loading={xrds === null}
        filterFunction={filterFunction}
        emptyMessage="No composite resource definitions found"
      />
    </SectionBox>
  );
}
