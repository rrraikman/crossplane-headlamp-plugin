import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { LoadError } from '../components/LoadError';
import { PackageRevisionSection } from '../components/PackageRevisionSection';
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

  const [pkg, pkgError] = PackageClass.useGet(name);
  const revisionName: string = pkg?.jsonData?.status?.currentRevision ?? '';

  if (pkgError) return <LoadError what={name} error={pkgError} />;
  if (!pkg) return <Loader title="Loading..." />;

  const conditions: any[] = pkg.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(pkg, 'Installed');
  const healthy = conditionStatus(pkg, 'Healthy');
  const overallOk = installed === 'True' && healthy === 'True';

  return (
    <Box pb={6}>
      <BackLink />
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip key="status" size="small"
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

      {revisionName && (
        <PackageRevisionSection revisionClass={RevisionClass} name={revisionName} label={revisionLabel} />
      )}

      <EventsTable resourceName={name} resourceKind={kind} />
    </Box>
  );
}
