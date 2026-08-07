import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Composition } from '../resources';
import { age } from '../utils';

export function CompositionList() {
  const [compositions] = Composition.useList();
  const filterFunction = useFilterFunc();

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
          {
            header: 'Composite Type',
            accessorFn: (r: any) => r.jsonData.spec?.compositeTypeRef?.kind ?? '—',
          },
          {
            header: 'Mode',
            accessorFn: (r: any) => r.jsonData.spec?.mode ?? 'Resources',
          },
          {
            header: 'Age',
            accessorFn: (r: any) => age(r.metadata.creationTimestamp),
          },
        ]}
        data={compositions ?? []}
        loading={compositions === null}
        filterFunction={filterFunction}
        emptyMessage="No compositions found"
      />
    </SectionBox>
  );
}
