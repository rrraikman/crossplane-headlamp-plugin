import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { Configuration, ConfigurationRevision } from '../resources';
import { age, conditionStatus } from '../utils';
import { packageStatusLabel } from './Detail.utils';

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

  return (
    <Box pb={6}>
      <BackLink />

      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={packageStatusLabel(installed, healthy)}
          color={overallOk ? 'success' : 'error'}
        />,
      ] }}>
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
