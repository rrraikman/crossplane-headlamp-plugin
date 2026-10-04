import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { statusColumn } from '../components/tableColumns';
import { Configuration, Provider } from '../resources';
import { age, conditionStatus } from '../utils';

export function PackageList() {
  const [providers] = Provider.useList();
  const [configurations] = Configuration.useList();

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
            statusColumn('Installed', (r: any) => conditionStatus(r, 'Installed')),
            statusColumn('Healthy', (r: any) => conditionStatus(r, 'Healthy')),
            { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
          ]}
          data={providers ?? []}
          enableFacetedValues
          loading={providers === null}
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
            statusColumn('Installed', (r: any) => conditionStatus(r, 'Installed')),
            statusColumn('Healthy', (r: any) => conditionStatus(r, 'Healthy')),
            { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
          ]}
          data={configurations ?? []}
          enableFacetedValues
          loading={configurations === null}
          emptyMessage="No configurations found"
        />
      </SectionBox>
    </Box>
  );
}
