import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Alert, Box } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { ManagedResources } from '../components/ManagedResources';
import { age, rawConditionStatus } from '../utils';

export function CompositeDetail() {
  const { group, version, plural, name } = useParams<{
    group: string;
    version: string;
    plural: string;
    name: string;
  }>();

  const XRClass = useMemo(() => {
    class DynamicXR extends KubeObject {
      static kind = plural;
      static apiName = plural;
      static apiVersion = `${group}/${version}`;
      static isNamespaced = false;
    }
    return DynamicXR;
  }, [group, version, plural]);

  const [xrs, error] = XRClass.useList();
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
  const failingCond = conditions.find(
    (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
  );
  const overallOk = ready === 'True' && synced === 'True';

  return (
    <Box pb={6}>
      <BackLink />
      <Box px={2} pt={2}>
        {overallOk ? (
          <Alert severity="success">Ready and synced</Alert>
        ) : synced !== 'True' ? (
          <Alert severity="error">
            <strong>Sync failed</strong>
            {failingCond?.reason && ` — ${failingCond.reason}`}
            {failingCond?.message && `: ${failingCond.message}`}
          </Alert>
        ) : ready !== 'True' ? (
          <Alert severity="warning">
            <strong>Not ready</strong>
            {failingCond?.reason && ` — ${failingCond.reason}`}
            {failingCond?.message && `: ${failingCond.message}`}
          </Alert>
        ) : (
          <Alert severity="warning">Status unknown</Alert>
        )}
      </Box>

      <SectionBox title={name}>
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
