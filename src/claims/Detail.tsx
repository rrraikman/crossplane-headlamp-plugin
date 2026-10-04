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
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { LoadError } from '../components/LoadError';
import { ReconcileButton } from '../components/ReconcileButton';
import { useDynamicKubeList } from '../hooks';
import { ManagedResources } from '../managed/ManagedResources';
import { age, rawConditionStatus, readySyncedStatusLabel } from '../utils';
import { FailingResource, fetchFailingManagedResource, fetchXRData, resolveXRPlural } from './Detail.utils';

export function ClaimDetail() {
  const { group, version, plural, namespace, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    namespace: string;
    name: string;
  }>();

  const [claims, claimError] = useDynamicKubeList(group, version, plural, true, { namespace });
  const claimResource = useMemo(
    () => claims?.find(r => r.metadata.name === name) ?? null,
    [claims, name]
  );
  const claim = claimResource?.jsonData ?? null;

  const [xrResourceRefs, setXrResourceRefs] = useState<any[] | null>(null);
  const [xrConditions, setXrConditions] = useState<any[] | null>(null);
  const [xrPlural, setXrPlural] = useState<string | null>(null);
  const [failingResource, setFailingResource] = useState<FailingResource | null>(null);

  // If the route component stays mounted across claim-to-claim navigation, the
  // previous claim's XR data must not be shown against the new one.
  useEffect(() => {
    setXrResourceRefs(null);
    setXrConditions(null);
    setXrPlural(null);
    setFailingResource(null);
  }, [group, version, plural, namespace, name]);

  useEffect(() => {
    if (!claim) return;
    const resourceRef = claim.spec?.crossplane?.resourceRef ?? claim.spec?.resourceRef;
    let cancelled = false;
    fetchXRData(resourceRef).then(data => {
      if (cancelled) return;
      setXrResourceRefs(data?.resourceRefs ?? []);
      setXrConditions(data?.conditions ?? []);
    });
    resolveXRPlural(resourceRef).then(p => {
      if (!cancelled) setXrPlural(p);
    });
    return () => {
      cancelled = true;
    };
  }, [claim]);

  useEffect(() => {
    if (!xrResourceRefs || !xrConditions) return;
    const xrFailing = xrConditions.some(
      (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
    );
    if (!xrFailing) {
      setFailingResource(null);
      return;
    }
    let cancelled = false;
    fetchFailingManagedResource(xrResourceRefs).then(r => {
      if (!cancelled) setFailingResource(r);
    });
    return () => {
      cancelled = true;
    };
  }, [xrResourceRefs, xrConditions]);

  if (!claims && !claimError) return <Loader title="Loading..." />;

  if (claimError || !claim) return <LoadError what={`${namespace}/${name}`} error={claimError} />;

  const conditions: any[] = claim.status?.conditions ?? [];
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  const overallOk = ready === 'True' && synced === 'True';
  const xrRef = claim.spec?.crossplane?.resourceRef ?? claim.spec?.resourceRef;

  // Prefer the XR's failing condition message — it's more specific (e.g. compose errors,
  // MR sync errors). Fall back to the claim's own conditions.
  const errorMessage = (() => {
    if (overallOk) return null;
    for (const conds of [xrConditions ?? [], conditions]) {
      const failing = conds.find(
        (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready') && c.message
      );
      if (failing?.message) return failing.message;
    }
    return null;
  })();

  // Link to the specific failing MR; fall back to the XR when no MR is identified yet
  // (e.g. compose errors where no MR has been created).
  const errorRoute: { routeName: string; params: Record<string, string> } | null = (() => {
    if (!errorMessage) return null;
    if (failingResource) {
      return { routeName: 'crossplane-managed-detail', params: failingResource.routeParams };
    }
    if (xrRef?.apiVersion && xrRef?.name && xrPlural) {
      const [xrGroup, xrVersion] = xrRef.apiVersion.split('/');
      return {
        routeName: 'crossplane-composite-detail',
        params: { group: xrGroup, version: xrVersion, plural: xrPlural, name: xrRef.name },
      };
    }
    return null;
  })();

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

      <SectionBox title={name} headerProps={{
        titleSideActions: [
          <Chip key="status" size="small"
            label={readySyncedStatusLabel(ready, synced)}
            color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
          />,
        ],
        actions: [
          <ReconcileButton key="reconcile" resource={claimResource!} />,
        ],
      }}>
        <NameValueTable
          rows={[
            { name: 'Kind', value: claim.kind },
            { name: 'Namespace', value: namespace },
            {
              name: 'Composition',
              value: (() => {
                const compName =
                  (claim.spec?.crossplane?.compositionRef ?? claim.spec?.compositionRef)?.name;
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
              name: 'Composite Resource',
              value: xrRef?.name ? (
                <HeadlampLink
                  routeName="crossplane-composite-detail"
                  params={{
                    group: xrRef.apiVersion.split('/')[0],
                    version: xrRef.apiVersion.split('/')[1],
                    plural: xrPlural ?? xrRef.kind.toLowerCase() + 's',
                    name: xrRef.name,
                  }}
                >
                  {xrRef.name}
                </HeadlampLink>
              ) : (
                '—'
              ),
            },
            { name: 'Age', value: age(claim.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      <EventsTable resourceName={name} resourceKind={claim.kind} namespace={namespace} />

      <ManagedResources resourceRefs={xrResourceRefs ?? undefined} />
    </Box>
  );
}
