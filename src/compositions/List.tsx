import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { facetColumn } from '../components/tableColumns';
import { Composition } from '../resources';
import { age } from '../utils';

export function CompositionList() {
  const [compositions] = Composition.useList();

  return (
    <SectionBox title="Compositions">
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (r: any) => r.metadata.name,
            Cell: ({ row }: any) => (
              <HeadlampLink
                routeName="crossplane-composition-detail"
                params={{ name: row.original.metadata.name }}
              >
                {row.original.metadata.name}
              </HeadlampLink>
            ),
          },
          facetColumn('Composite Type', (r: any) => r.jsonData.spec?.compositeTypeRef?.kind),
          facetColumn('Mode', (r: any) => r.jsonData.spec?.mode ?? 'Resources'),
          {
            header: 'Age',
            accessorFn: (r: any) => age(r.metadata.creationTimestamp),
          },
        ]}
        data={compositions ?? []}
        enableFacetedValues
        loading={compositions === null}
        emptyMessage="No compositions found"
      />
    </SectionBox>
  );
}
