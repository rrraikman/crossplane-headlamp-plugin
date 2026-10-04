import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  BackLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Chip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { LoadError } from '../components/LoadError';
import { ReconcileButton } from '../components/ReconcileButton';
import { resourcePath } from '../discovery';
import { useDynamicKubeList } from '../hooks';
import { age, debugMessage, rawConditionStatus, readySyncedStatusLabel } from '../utils';

export function ManagedResourceDetail() {
  const { group, version, plural, namespace, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    namespace?: string;
    name: string;
  }>();

  const [mrs, error] = useDynamicKubeList(group, version, plural, !!namespace, { namespace });
  const mrResource = useMemo(
    () => mrs?.find(r => r.metadata.name === name) ?? null,
    [mrs, name]
  );
  const mr = mrResource?.jsonData ?? null;

  // Fetch full spec via GET (list responses sometimes omit it).
  const [spec, setSpec] = useState<any>(undefined);
  useEffect(() => {
    setSpec(undefined);
    const apiVersion = `${group}/${version}`;
    let cancelled = false;
    request(resourcePath(apiVersion, plural, { namespace, name }))
      .then((data: any) => data.spec ?? null)
      .catch(() =>
        request(resourcePath(apiVersion, plural, { namespace }))
          .then((data: any) => {
            const found = (data.items ?? []).find((r: any) => r.metadata.name === name);
            return found?.spec ?? null;
          })
          .catch(() => null)
      )
      .then((s: any) => {
        if (!cancelled) setSpec(s);
      });
    return () => {
      cancelled = true;
    };
  }, [group, version, plural, namespace, name]);

  if (!mrs && !error) return <Loader title="Loading..." />;

  if (error || !mr) return <LoadError what={`${plural}/${namespace ? `${namespace}/` : ''}${name}`} error={error} />;

  const conditions: any[] = mr.status?.conditions ?? [];
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  const overallOk = ready === 'True' && synced === 'True';

  const errorMessage = overallOk ? null : debugMessage(conditions);

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
          <Chip key="status" size="small"
            label={readySyncedStatusLabel(ready, synced)}
            color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
          />,
        ],
        actions: [
          <ReconcileButton key="reconcile" resource={mrResource!} />,
        ],
      }}>
        <NameValueTable
          rows={[
            { name: 'Kind', value: mr.kind },
            { name: 'Namespace', value: namespace, hide: !namespace },
            { name: 'API Version', value: mr.apiVersion },
            { name: 'Age', value: age(mr.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      <EventsTable resourceName={name} resourceKind={mr.kind} namespace={namespace} />

      <SectionBox title="Spec">
        {spec ? (
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
        ) : (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            {spec === undefined ? 'Loading spec…' : 'No spec available'}
          </Typography>
        )}
      </SectionBox>
    </Box>
  );
}
