import { Icon } from '@iconify/react';
import { registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { ConditionsTable } from '../components/ConditionsTable';
import { makeKubeObject } from '../hooks';
import { CompositeResourceDefinition, Composition } from '../resources';
import { getReferenceableVersion } from '../utils';
import { nodeStatus } from './mapSource.utils';

function splitApiVersion(apiVersion: string): { group: string; version: string } {
  const slash = apiVersion.indexOf('/');
  return slash >= 0
    ? { group: apiVersion.slice(0, slash), version: apiVersion.slice(slash + 1) }
    : { group: '', version: apiVersion };
}

function CompositionDetailsPanel({ node }: { node: any }) {
  const name: string = node.kubeObject.metadata.name;
  const conditions: any[] = node.kubeObject.jsonData?.status?.conditions ?? [];
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>{name}</Typography>
      <HeadlampLink routeName="crossplane-composition-detail" params={{ name }}>
        View full details
      </HeadlampLink>
      <Box mt={2}>
        <ConditionsTable conditions={conditions} />
      </Box>
    </Box>
  );
}

function XRDetailsPanel({ node }: { node: any }) {
  const name: string = node.kubeObject.metadata.name;
  const apiVersion: string = node.kubeObject.constructor.apiVersion ?? '';
  const plural: string = node.kubeObject.constructor.apiName ?? '';
  const { group, version } = splitApiVersion(apiVersion);
  const conditions: any[] = node.kubeObject.jsonData?.status?.conditions ?? [];
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>{name}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{node.subtitle}</Typography>
      <HeadlampLink routeName="crossplane-composite-detail" params={{ group, version, plural, name }}>
        View full details
      </HeadlampLink>
      <Box mt={2}>
        <ConditionsTable conditions={conditions} />
      </Box>
    </Box>
  );
}

function ClaimDetailsPanel({ node }: { node: any }) {
  const name: string = node.kubeObject.metadata.name;
  const namespace: string = node.kubeObject.metadata.namespace ?? '';
  const apiVersion: string = node.kubeObject.constructor.apiVersion ?? '';
  const plural: string = node.kubeObject.constructor.apiName ?? '';
  const { group, version } = splitApiVersion(apiVersion);
  const conditions: any[] = node.kubeObject.jsonData?.status?.conditions ?? [];
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>{name}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{node.subtitle}</Typography>
      <HeadlampLink
        routeName="crossplane-claim-detail"
        params={{ group, version, plural, namespace, name }}
      >
        View full details
      </HeadlampLink>
      <Box mt={2}>
        <ConditionsTable conditions={conditions} />
      </Box>
    </Box>
  );
}

function useCrossplaneGraphData() {
  const [xrds] = CompositeResourceDefinition.useList();
  const [compositions] = Composition.useList();

  const [xrItems, setXrItems] = useState<any[] | null>(null);
  const [claimItems, setClaimItems] = useState<any[] | null>(null);

  const xrdsKey = useMemo(
    () => xrds?.map((x: any) => x.metadata.name).sort().join(',') ?? '',
    [xrds]
  );

  useEffect(() => {
    if (!xrds) return;
    if (xrds.length === 0) {
      setXrItems([]);
      setClaimItems([]);
      return;
    }

    const xrPromises = xrds.map((xrd: any) => {
      const spec = xrd.jsonData.spec;
      const group = spec.group;
      const version = getReferenceableVersion(spec);
      const plural = spec.names.plural;
      const kind = spec.names.kind;
      const apiVersion = `${group}/${version}`;
      const isNamespaced = spec.scope === 'Namespaced';
      return request(`/apis/${group}/${version}/${plural}`)
        .then((data: any) =>
          (data.items ?? []).map((item: any) => ({
            ...item,
            __kind: kind,
            __plural: plural,
            __apiVersion: apiVersion,
            __isNamespaced: isNamespaced,
          }))
        )
        .catch(() => []);
    });

    const claimPromises = xrds
      .filter((xrd: any) => xrd.jsonData.spec?.claimNames?.plural)
      .map((xrd: any) => {
        const spec = xrd.jsonData.spec;
        const group = spec.group;
        const version = getReferenceableVersion(spec);
        const claimPlural = spec.claimNames.plural;
        const claimKind = spec.claimNames.kind;
        const apiVersion = `${group}/${version}`;
        return request(`/apis/${group}/${version}/${claimPlural}`)
          .then((data: any) =>
            (data.items ?? []).map((item: any) => ({
              ...item,
              __kind: claimKind,
              __plural: claimPlural,
              __apiVersion: apiVersion,
              __isNamespaced: true,
            }))
          )
          .catch(() => []);
      });

    Promise.all(xrPromises).then(results => setXrItems((results as any[][]).flat()));
    Promise.all(claimPromises).then(results => setClaimItems((results as any[][]).flat()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  return useMemo(() => {
    if (!compositions && xrItems === null) return null;

    const nodes: any[] = [];
    const edges: any[] = [];

    // Composition nodes
    for (const comp of (compositions ?? []) as any[]) {
      nodes.push({
        id: comp.metadata.uid,
        kubeObject: comp,
        detailsComponent: CompositionDetailsPanel,
        weight: 800,
      });
    }

    // XR nodes + XR→Composition edges
    for (const xr of xrItems ?? []) {
      const uid = xr.metadata?.uid;
      if (!uid) continue;

      nodes.push({
        id: uid,
        label: xr.metadata.name,
        subtitle: xr.__kind,
        kubeObject: makeKubeObject(xr, xr.__kind, xr.__plural, xr.__apiVersion, xr.__isNamespaced),
        detailsComponent: XRDetailsPanel,
        status: nodeStatus(xr.status?.conditions ?? []),
        weight: 1200,
      });

      const compName = (xr.spec?.crossplane?.compositionRef ?? xr.spec?.compositionRef)?.name;
      if (compName && compositions) {
        const comp = (compositions as any[]).find((c: any) => c.metadata.name === compName);
        if (comp?.metadata.uid) {
          edges.push({
            id: `xr-comp-${uid}-${comp.metadata.uid}`,
            source: uid,
            target: comp.metadata.uid,
          });
        }
      }
    }

    // Claim nodes + Claim→XR edges
    for (const claim of claimItems ?? []) {
      const uid = claim.metadata?.uid;
      if (!uid) continue;

      nodes.push({
        id: uid,
        label: claim.metadata.name,
        subtitle: `${claim.__kind} · ${claim.metadata.namespace}`,
        kubeObject: makeKubeObject(claim, claim.__kind, claim.__plural, claim.__apiVersion, true),
        detailsComponent: ClaimDetailsPanel,
        status: nodeStatus(claim.status?.conditions ?? []),
        weight: 1500,
      });

      const xrRef = claim.spec?.crossplane?.resourceRef ?? claim.spec?.resourceRef;
      if (xrRef?.name && xrItems) {
        const xr = xrItems.find((x: any) => x.metadata.name === xrRef.name);
        if (xr?.metadata?.uid) {
          edges.push({
            id: `claim-xr-${uid}-${xr.metadata.uid}`,
            source: uid,
            target: xr.metadata.uid,
          });
        }
      }
    }

    return { nodes, edges };
  }, [compositions, xrItems, claimItems]);
}

export function registerCrossplaneMapSource() {
  registerMapSource({
    id: 'crossplane',
    label: 'Crossplane',
    icon: <Icon icon="mdi:crosshairs" width={16} />,
    useData: useCrossplaneGraphData,
  });
}
