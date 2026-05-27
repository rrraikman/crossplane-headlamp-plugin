import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { Configuration, ConfigurationRevision } from '../resources';
import { age, conditionStatus } from '../utils';

export function ConfigurationDetail() {
  const { name } = useParams<{ name: string }>();
  const [configuration] = Configuration.useGet(name);

  const revisionName = configuration?.jsonData?.status?.currentRevision ?? '';
  const [revision] = ConfigurationRevision.useGet(revisionName);

  if (!configuration) return <Loader title="Loading..." />;

  const conditions: any[] = configuration.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(configuration, 'Installed');
  const healthy = conditionStatus(configuration, 'Healthy');

  const overallOk = installed === 'True' && healthy === 'True';
  const failingCond = conditions.find(
    (c: any) => c.status !== 'True' && (c.type === 'Healthy' || c.type === 'Installed')
  );

  return (
    <Box pb={6}>
      <BackLink />

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

      <SectionBox title={name}>
        <NameValueTable
          rows={[
            { name: 'Package', value: configuration.jsonData.spec?.package ?? '—' },
            {
              name: 'Current Revision',
              value: configuration.jsonData.status?.currentRevision ?? '—',
            },
            { name: 'Age', value: age(configuration.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      {revision && (
        <SectionBox title={`Configuration Revision: ${revisionName}`}>
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
