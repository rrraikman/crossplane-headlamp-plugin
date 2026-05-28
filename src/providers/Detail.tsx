import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { Provider, ProviderRevision } from '../resources';
import { age, conditionStatus } from '../utils';

export function ProviderDetail() {
  const { name } = useParams<{ name: string }>();
  const [provider] = Provider.useGet(name);

  const revisionName = provider?.jsonData?.status?.currentRevision ?? '';
  const [revision] = ProviderRevision.useGet(revisionName);

  if (!provider) return <Loader title="Loading..." />;

  const conditions: any[] = provider.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(provider, 'Installed');
  const healthy = conditionStatus(provider, 'Healthy');

  const overallOk = installed === 'True' && healthy === 'True';

  return (
    <Box pb={6}>
      <BackLink />
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={overallOk ? 'Healthy' : installed !== 'True' ? 'Not Installed' : 'Unhealthy'}
          color={overallOk ? 'success' : 'error'}
        />,
      ] }}>
        <NameValueTable
          rows={[
            { name: 'Package', value: provider.jsonData.spec?.package ?? '—' },
            { name: 'Current Revision', value: provider.jsonData.status?.currentRevision ?? '—' },
            { name: 'Age', value: age(provider.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      {/* Conditions */}
      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      {/* Provider Revision */}
      {revision && (
        <SectionBox title={`Provider Revision: ${revisionName}`}>
          <NameValueTable
            rows={[
              { name: 'Package', value: revision.jsonData.spec?.package ?? '—' },
              { name: 'Revision', value: String(revision.jsonData.spec?.revision ?? '—') },
              { name: 'Desired State', value: revision.jsonData.spec?.desiredState ?? '—' },
            ]}
          />
          <Box mt={2}>
            <ConditionsTable conditions={revision.jsonData.status?.conditions ?? []} />
          </Box>
        </SectionBox>
      )}
    </Box>
  );
}
