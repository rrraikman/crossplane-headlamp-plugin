import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box } from '@mui/material';
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
  const failingCond = conditions.find(
    (c: any) => c.status !== 'True' && (c.type === 'Healthy' || c.type === 'Installed')
  );

  return (
    <Box pb={6}>
      <BackLink />
      {/* Status bar */}
      <Box px={2} pt={2}>
        {overallOk ? (
          <Alert severity="success">Installed and healthy</Alert>
        ) : installed !== 'True' ? (
          <Alert severity="error">
            <strong>Not installed</strong>
            {failingCond?.reason && ` — ${failingCond.reason}`}
            {failingCond?.message && `: ${failingCond.message}`}
          </Alert>
        ) : healthy !== 'True' ? (
          <Alert severity="error">
            <strong>Unhealthy</strong>
            {failingCond?.reason && ` — ${failingCond.reason}`}
            {failingCond?.message && `: ${failingCond.message}`}
          </Alert>
        ) : (
          <Alert severity="warning">Status unknown</Alert>
        )}
      </Box>

      {/* Metadata */}
      <SectionBox title={name}>
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
