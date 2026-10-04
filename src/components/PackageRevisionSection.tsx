import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { ConditionsTable } from './ConditionsTable';

interface RevisionClass {
  useGet: (name: string) => readonly [any, any];
}

// Only mount this when the package reports a currentRevision: useGet('') would
// list (and watch) every revision in the cluster.
export function PackageRevisionSection({
  revisionClass,
  name,
  label,
}: {
  revisionClass: RevisionClass;
  name: string;
  label: string;
}) {
  const [revision] = revisionClass.useGet(name);
  if (!revision) return null;

  return (
    <SectionBox title={`${label}: ${name}`}>
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
  );
}
