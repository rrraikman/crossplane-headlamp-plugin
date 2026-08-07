import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { CrossplaneFunction } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function FunctionList() {
  const [functions] = CrossplaneFunction.useList();
  const filterFunction = useFilterFunc();

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
          {
            header: 'Installed',
            accessorFn: (r: any) => conditionStatus(r, 'Installed'),
            Cell: ({ row }: any) => <StatusChip status={conditionStatus(row.original, 'Installed')} />,
          },
          {
            header: 'Healthy',
            accessorFn: (r: any) => conditionStatus(r, 'Healthy'),
            Cell: ({ row }: any) => <StatusChip status={conditionStatus(row.original, 'Healthy')} />,
          },
          { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={functions ?? []}
        loading={functions === null}
        filterFunction={filterFunction}
        emptyMessage="No functions found"
      />
    </SectionBox>
  );
}
