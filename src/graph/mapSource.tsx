import { Icon } from '@iconify/react';
import { registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { useEffect, useMemo, useState } from 'react';
import { CompositeResourceDefinition,Composition } from '../resources';
import { getReferenceableVersion } from '../utils';
import { nodeStatus } from './mapSource.utils';

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
      return request(`/apis/${group}/${version}/${plural}`)
        .then((data: any) =>
          (data.items ?? []).map((item: any) => ({
            ...item,
            __kind: kind,
            __group: group,
            __version: version,
            __plural: plural,
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
        return request(`/apis/${group}/${version}/${claimPlural}`)
          .then((data: any) =>
            (data.items ?? []).map((item: any) => ({
              ...item,
              __kind: claimKind,
              __group: group,
              __version: version,
              __plural: claimPlural,
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
        weight: 800,
      });
    }

    // XR nodes + XR→Composition edges
    for (const xr of xrItems ?? []) {
      const uid = xr.metadata?.uid;
      if (!uid) continue;

      // kubeObject is required for Headlamp's map namespace filter to recognise the
      // resource's namespace. label/subtitle are kept explicit because our duck-typed
      // object doesn't carry a static `kind` property for Headlamp to derive them from.
      nodes.push({
        id: uid,
        label: xr.metadata.name,
        subtitle: xr.__kind || xr.kind,
        kubeObject: { metadata: xr.metadata, jsonData: xr },
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
        kubeObject: { metadata: claim.metadata, jsonData: claim },
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
