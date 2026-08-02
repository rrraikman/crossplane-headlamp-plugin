import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box } from '@mui/material';
import { Configuration, Provider } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function PackageList() {
  const [providers] = Provider.useList();
  const [configurations] = Configuration.useList();
  const filterFunction = useFilterFunc();

  return (
    <Box pb={6}>
      <SectionBox title="Providers">
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (r: any) => r.metadata.name,
              Cell: ({ row }: any) => (
                <HeadlampLink routeName="crossplane-provider-detail" params={{ name: row.original.metadata.name }}>
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
          data={providers ?? []}
          loading={providers === null}
          filterFunction={filterFunction}
          emptyMessage="No providers found"
        />
      </SectionBox>

      <SectionBox title="Configurations">
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (r: any) => r.metadata.name,
              Cell: ({ row }: any) => (
                <HeadlampLink routeName="crossplane-configuration-detail" params={{ name: row.original.metadata.name }}>
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
          data={configurations ?? []}
          loading={configurations === null}
          filterFunction={filterFunction}
          emptyMessage="No configurations found"
        />
      </SectionBox>
    </Box>
  );
}
