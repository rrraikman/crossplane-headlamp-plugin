import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { statusColumn } from '../components/tableColumns';
import { CrossplaneFunction } from '../resources';
import { age, conditionStatus } from '../utils';

export function FunctionList() {
  const [functions] = CrossplaneFunction.useList();

  return (
    <SectionBox title="Functions">
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (r: any) => r.metadata.name,
            Cell: ({ row }: any) => (
              <HeadlampLink
                routeName="crossplane-function-detail"
                params={{ name: row.original.metadata.name }}
              >
                {row.original.metadata.name}
              </HeadlampLink>
            ),
          },
          { header: 'Package', accessorFn: (r: any) => r.jsonData.spec?.package ?? '—' },
          statusColumn('Installed', (r: any) => conditionStatus(r, 'Installed')),
          statusColumn('Healthy', (r: any) => conditionStatus(r, 'Healthy')),
          { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={functions ?? []}
        enableFacetedValues
        loading={functions === null}
        emptyMessage="No functions found"
      />
    </SectionBox>
  );
}
