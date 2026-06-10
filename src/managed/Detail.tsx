import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Chip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { ReconcileButton } from '../components/ReconcileButton';
import { useDynamicKubeList } from '../hooks';
import { age, rawConditionStatus, readySyncedStatusLabel } from '../utils';

export function ManagedResourceDetail() {
  const { group, version, plural, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    name: string;
  }>();

  const [mrs, error] = useDynamicKubeList(group, version, plural, false);
  const mrResource = useMemo(
    () => mrs?.find(r => r.metadata.name === name) ?? null,
    [mrs, name]
  );
  const mr = mrResource?.jsonData ?? null;

  // Fetch full spec via GET (list responses sometimes omit it).
  const [spec, setSpec] = useState<any>(undefined);
  useEffect(() => {
    setSpec(undefined);
    request(`/apis/${group}/${version}/${plural}/${name}`)
      .then((data: any) => setSpec(data.spec ?? null))
      .catch(() =>
        request(`/apis/${group}/${version}/${plural}`)
          .then((data: any) => {
            const found = (data.items ?? []).find((r: any) => r.metadata.name === name);
            setSpec(found?.spec ?? null);
          })
          .catch(() => setSpec(null))
      );
  }, [group, version, plural, name]);

  if (!mrs && !error) return <Loader title="Loading..." />;

  if (error || !mr) {
    return (
      <>
        <BackLink />
        <Box p={2}>
          <Alert severity="error">
            Failed to load <strong>{plural}/{name}</strong>
            {error && `: ${error.message}`}
          </Alert>
        </Box>
      </>
    );
  }

  const conditions: any[] = mr.status?.conditions ?? [];
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  const overallOk = ready === 'True' && synced === 'True';

  const errorMessage = (() => {
    if (overallOk) return null;
    const failing = conditions.find(
      (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready') && c.message
    );
    return failing?.message ?? null;
  })();

  return (
    <Box pb={6}>
      <BackLink />

      {errorMessage && (
        <Box px={2} pt={2}>
          <Alert severity="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <SectionBox title={name} headerProps={{
        titleSideActions: [
          <Chip size="small"
            label={readySyncedStatusLabel(ready, synced)}
            color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
          />,
        ],
        actions: [
          <ReconcileButton resource={mrResource!} />,
        ],
      }}>
        <NameValueTable
          rows={[
            { name: 'Kind', value: mr.kind },
            { name: 'API Version', value: mr.apiVersion },
            { name: 'Age', value: age(mr.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      <EventsTable resourceName={name} resourceKind={mr.kind} />

      {spec && (
        <SectionBox title="Spec">
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              overflow: 'auto',
              p: 2,
              m: 0,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: theme => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
            }}
          >
            {JSON.stringify(spec, null, 2)}
          </Box>
        </SectionBox>
      )}
    </Box>
  );
}
