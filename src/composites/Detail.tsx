import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Chip } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { useDynamicKubeList } from '../hooks';
import { ManagedResources } from '../managed/ManagedResources';
import { age, rawConditionStatus, readySyncedStatusLabel } from '../utils';

export function CompositeDetail() {
  const { group, version, plural, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    name: string;
  }>();

  const [xrs, error] = useDynamicKubeList(group, version, plural, false);
  const xr = useMemo(
    () => xrs?.find(r => r.metadata.name === name)?.jsonData ?? null,
    [xrs, name]
  );

  if (!xrs && !error) return <Loader title="Loading..." />;

  if (error || !xr) {
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

  const conditions: any[] = xr.status?.conditions ?? [];
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  const overallOk = ready === 'True' && synced === 'True';

  return (
    <Box pb={6}>
      <BackLink />

      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={readySyncedStatusLabel(ready, synced)}
          color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
        />,
      ] }}>
        <NameValueTable
          rows={[
            { name: 'Kind', value: xr.kind },
            { name: 'API Version', value: xr.apiVersion },
            {
              name: 'Composition',
              value: (() => {
                const compName =
                  (xr.spec?.crossplane?.compositionRef ?? xr.spec?.compositionRef)?.name;
                return compName ? (
                  <HeadlampLink
                    routeName="crossplane-composition-detail"
                    params={{ name: compName }}
                  >
                    {compName}
                  </HeadlampLink>
                ) : (
                  '—'
                );
              })(),
            },
            {
              name: 'Claim',
              value: (xr.spec?.crossplane?.claimRef ?? xr.spec?.claimRef)?.name ?? '—',
              hide: !(xr.spec?.crossplane?.claimRef ?? xr.spec?.claimRef),
            },
            {
              name: 'Claim Namespace',
              value:
                (xr.spec?.crossplane?.claimRef ?? xr.spec?.claimRef)?.namespace ?? '—',
              hide: !(xr.spec?.crossplane?.claimRef ?? xr.spec?.claimRef),
            },
            { name: 'Age', value: age(xr.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      <EventsTable resourceName={name} resourceKind={xr.kind} />

      <ManagedResources resourceRefs={xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs} />
    </Box>
  );
}
