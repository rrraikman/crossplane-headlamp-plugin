import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Chip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FailingResource, fetchFailingManagedResource } from '../claims/Detail.utils';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { ReconcileButton } from '../components/ReconcileButton';
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
  const xrResource = useMemo(
    () => xrs?.find(r => r.metadata.name === name) ?? null,
    [xrs, name]
  );
  const xr = xrResource?.jsonData ?? null;

  const [failingResource, setFailingResource] = useState<FailingResource | null>(null);

  useEffect(() => {
    if (!xr) return;
    const conditions: any[] = xr.status?.conditions ?? [];
    const failing = conditions.some(
      (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
    );
    if (!failing) return;
    const resourceRefs = xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs ?? [];
    fetchFailingManagedResource(resourceRefs).then(setFailingResource);
  }, [xr]);

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

  const errorMessage = (() => {
    if (overallOk) return null;
    const failing = conditions.find(
      (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready') && c.message
    );
    return failing?.message ?? null;
  })();

  const errorRoute: { routeName: string; params: Record<string, string> } | null = failingResource
    ? { routeName: 'crossplane-managed-detail', params: failingResource.routeParams }
    : null;

  return (
    <Box pb={6}>
      <BackLink />

      {errorMessage && (
        <Box px={2} pt={2}>
          {errorRoute ? (
            <HeadlampLink
              routeName={errorRoute.routeName}
              params={errorRoute.params}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <Alert
                severity="error"
                sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'pointer' }}
              >
                {errorMessage}
              </Alert>
            </HeadlampLink>
          ) : (
            <Alert severity="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      )}

      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={readySyncedStatusLabel(ready, synced)}
          color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
        />,
        <ReconcileButton resource={xrResource!} />,
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
