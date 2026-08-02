import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useDynamicKubeList } from '../hooks';
import { age, rawConditionStatus, StatusChip } from '../utils';

function sortByReady(items: any[]): any[] {
  return [...items].sort((a, b) => {
    const aOk = rawConditionStatus(a.jsonData?.status?.conditions ?? [], 'Ready') === 'True';
    const bOk = rawConditionStatus(b.jsonData?.status?.conditions ?? [], 'Ready') === 'True';
    return Number(aOk) - Number(bOk);
  });
}

export function ManagedResourceTypeList() {
  const { group, version, plural, kind } = useParams<{
    group: string;
    version: string;
    plural: string;
    kind: string;
  }>();

  const [mrs, error] = useDynamicKubeList(group, version, plural, false, { kind });
  const filterFunction = useFilterFunc();

  if (!mrs && !error) return <Loader title={`Loading ${kind} resources...`} />;

  const rows = sortByReady(mrs ?? []);

  return (
    <Box pb={6}>
      <BackLink />
      <SectionBox title={kind}>
        <NameValueTable
          rows={[
            { name: 'API Group', value: group },
            { name: 'Version', value: version },
            { name: 'Plural', value: plural },
          ]}
        />
      </SectionBox>

      <SectionBox title={`Instances (${rows.length})`}>
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (r: any) => r.metadata.name,
              Cell: ({ row }: any) => (
                <HeadlampLink
                  routeName="crossplane-managed-detail"
                  params={{ group, version, plural, name: row.original.metadata.name }}
                >
                  {row.original.metadata.name}
                </HeadlampLink>
              ),
            },
            {
              header: 'Ready',
              accessorFn: (r: any) => rawConditionStatus(r.jsonData?.status?.conditions ?? [], 'Ready'),
              Cell: ({ row }: any) => (
                <StatusChip
                  status={rawConditionStatus(row.original.jsonData?.status?.conditions ?? [], 'Ready')}
                />
              ),
            },
            {
              header: 'Synced',
              accessorFn: (r: any) => rawConditionStatus(r.jsonData?.status?.conditions ?? [], 'Synced'),
              Cell: ({ row }: any) => (
                <StatusChip
                  status={rawConditionStatus(row.original.jsonData?.status?.conditions ?? [], 'Synced')}
                />
              ),
            },
            { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
          ]}
          data={rows}
          filterFunction={filterFunction}
          emptyMessage={`No ${kind} instances have been created yet`}
        />
      </SectionBox>
    </Box>
  );
}
