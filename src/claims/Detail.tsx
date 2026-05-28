import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Alert, Box, Chip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { ManagedResources } from '../components/ManagedResources';
import { age, rawConditionStatus } from '../utils';

async function fetchXRResourceRefs(resourceRef: any): Promise<any[] | null> {
  if (!resourceRef?.apiVersion || !resourceRef?.kind || !resourceRef?.name) return null;

  const slashIdx = resourceRef.apiVersion.lastIndexOf('/');
  const group = resourceRef.apiVersion.slice(0, slashIdx);
  const version = resourceRef.apiVersion.slice(slashIdx + 1);

  try {
    const discovery = await request(`/apis/${group}/${version}`);
    const resource = (discovery.resources ?? []).find(
      (r: any) => r.kind === resourceRef.kind && !r.name.includes('/')
    );
    const plural = resource?.name ?? resourceRef.kind.toLowerCase() + 's';
    const list = await request(`/apis/${group}/${version}/${plural}`);
    const xr = (list.items ?? []).find((r: any) => r.metadata.name === resourceRef.name);
    if (!xr) return null;
    return xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs ?? [];
  } catch {
    return null;
  }
}

export function ClaimDetail() {
  const { group, version, plural, namespace, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    namespace: string;
    name: string;
  }>();

  const ClaimClass = useMemo(() => {
    class DynamicClaim extends KubeObject {
      static kind = plural;
      static apiName = plural;
      static apiVersion = `${group}/${version}`;
      static isNamespaced = true;
    }
    return DynamicClaim;
  }, [group, version, plural]);

  const [claims, claimError] = ClaimClass.useList({ namespace });
  const claim = useMemo(
    () => claims?.find(r => r.metadata.name === name)?.jsonData ?? null,
    [claims, name]
  );

  const [xrResourceRefs, setXrResourceRefs] = useState<any[] | null>(null);

  useEffect(() => {
    if (!claim) return;
    const resourceRef = claim.spec?.crossplane?.resourceRef ?? claim.spec?.resourceRef;
    fetchXRResourceRefs(resourceRef).then(refs => setXrResourceRefs(refs ?? []));
  }, [claim]);

  if (!claims && !claimError) return <Loader title="Loading..." />;

  if (claimError || !claim) {
    return (
      <>
        <BackLink />
        <Box p={2}>
          <Alert severity="error">
            Failed to load <strong>{namespace}/{name}</strong>
            {claimError && `: ${claimError.message}`}
          </Alert>
        </Box>
      </>
    );
  }

  const conditions: any[] = claim.status?.conditions ?? [];
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  const overallOk = ready === 'True' && synced === 'True';
  const xrRef = claim.spec?.crossplane?.resourceRef ?? claim.spec?.resourceRef;

  return (
    <Box pb={6}>
      <BackLink />

      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={overallOk ? 'Ready' : synced !== 'True' ? 'Sync Failed' : ready !== 'True' ? 'Not Ready' : 'Unknown'}
          color={overallOk ? 'success' : synced !== 'True' ? 'error' : 'warning'}
        />,
      ] }}>
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
                    plural: xrRef.kind.toLowerCase() + 's',
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
