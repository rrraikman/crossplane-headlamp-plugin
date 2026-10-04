import { Link as HeadlampLink, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { facetColumn, statusColumn } from '../components/tableColumns';
import { CompositeResourceDefinition } from '../resources';
import { age, conditionStatus } from '../utils';

export function XRDList() {
  const [xrds] = CompositeResourceDefinition.useList();

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
          facetColumn('Group', (r: any) => r.jsonData.spec?.group),
          {
            header: 'Versions',
            accessorFn: (r: any) =>
              r.jsonData.spec?.versions?.map((v: any) => v.name).join(', ') ?? '—',
          },
          { header: 'Composite Kind', accessorFn: (r: any) => r.jsonData.spec?.names?.kind ?? '—' },
          { header: 'Claim Kind', accessorFn: (r: any) => r.jsonData.spec?.claimNames?.kind ?? '—' },
          statusColumn('Established', (r: any) => conditionStatus(r, 'Established')),
          { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={xrds ?? []}
        enableFacetedValues
        loading={xrds === null}
        emptyMessage="No composite resource definitions found"
      />
    </SectionBox>
  );
}
