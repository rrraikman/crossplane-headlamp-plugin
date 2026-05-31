import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { Configuration, ConfigurationRevision, Provider, ProviderRevision } from '../resources';
import { age, conditionStatus } from '../utils';
import { packageStatusLabel } from './Detail.utils';

type PackageKind = 'Provider' | 'Configuration';

interface PackageDetailProps {
  kind: PackageKind;
}

export function PackageDetail({ kind }: PackageDetailProps) {
  const { name } = useParams<{ name: string }>();

  const PackageClass = kind === 'Provider' ? Provider : Configuration;
  const RevisionClass = kind === 'Provider' ? ProviderRevision : ConfigurationRevision;
  const revisionLabel = kind === 'Provider' ? 'Provider Revision' : 'Configuration Revision';

  const [pkg] = PackageClass.useGet(name);
  const revisionName = pkg?.jsonData?.status?.currentRevision ?? '';
  const [revision] = RevisionClass.useGet(revisionName);

  if (!pkg) return <Loader title="Loading..." />;

  const conditions: any[] = pkg.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(pkg, 'Installed');
  const healthy = conditionStatus(pkg, 'Healthy');
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
            { name: 'Package', value: pkg.jsonData.spec?.package ?? '—' },
            { name: 'Current Revision', value: pkg.jsonData.status?.currentRevision ?? '—' },
            { name: 'Age', value: age(pkg.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      {revision && (
        <SectionBox title={`${revisionLabel}: ${revisionName}`}>
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
