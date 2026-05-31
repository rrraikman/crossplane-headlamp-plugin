import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (r: any) => (
                <HeadlampLink
                  routeName="crossplane-managed-detail"
                  params={{ group, version, plural, name: r.metadata.name }}
                >
                  {r.metadata.name}
                </HeadlampLink>
              ),
            },
            {
              label: 'Ready',
              getter: (r: any) => (
                <StatusChip
                  status={rawConditionStatus(r.jsonData?.status?.conditions ?? [], 'Ready')}
                />
              ),
            },
            {
              label: 'Synced',
              getter: (r: any) => (
                <StatusChip
                  status={rawConditionStatus(r.jsonData?.status?.conditions ?? [], 'Synced')}
                />
              ),
            },
            { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
          ]}
          data={rows}
          emptyMessage={`No ${kind} instances have been created yet`}
        />
      </SectionBox>
    </Box>
  );
}
