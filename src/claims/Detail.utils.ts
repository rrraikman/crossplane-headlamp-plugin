import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { detailRouteParams, discoverResource, resourcePath } from '../discovery';
import { ResourceRef, scopeRefs } from '../managed/ManagedResources.utils';
import { failingCondition } from '../utils';

export async function resolveXRPlural(xrRef: any): Promise<string> {
  if (!xrRef?.apiVersion || !xrRef?.kind) return (xrRef?.kind ?? '').toLowerCase() + 's';
  return (await discoverResource(xrRef.apiVersion, xrRef.kind)).plural;
}

export interface XRData {
  resourceRefs: any[];
  conditions: any[];
}

export async function fetchXRData(resourceRef: any): Promise<XRData | null> {
  if (!resourceRef?.apiVersion || !resourceRef?.kind || !resourceRef?.name) return null;

  try {
    const { plural } = await discoverResource(resourceRef.apiVersion, resourceRef.kind);
    const list = await request(resourcePath(resourceRef.apiVersion, plural));
    const xr = (list.items ?? []).find((r: any) => r.metadata.name === resourceRef.name);
    if (!xr) return null;
    return {
      resourceRefs: xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs ?? [],
      conditions: xr.status?.conditions ?? [],
    };
  } catch {
    return null;
  }
}

export interface FailingResource {
  kind: string;
  name: string;
  routeParams: Record<string, string>;
}

export async function fetchFailingManagedResource(
  resourceRefs: ResourceRef[],
  ownerNamespace?: string
): Promise<FailingResource | null> {
  const refs = scopeRefs(resourceRefs, ownerNamespace);
  if (!refs.length) return null;

  const results = await Promise.allSettled(
    refs.map(async (ref): Promise<FailingResource | null> => {
      const { plural, namespaced } = await discoverResource(ref.apiVersion, ref.kind);
      const namespace = namespaced === false ? undefined : ref.namespace;
      const obj = await request(resourcePath(ref.apiVersion, plural, { namespace, name: ref.name }));
      return failingCondition(obj.status?.conditions)
        ? {
            kind: ref.kind,
            name: ref.name,
            routeParams: detailRouteParams(ref.apiVersion, plural, ref.name, obj.metadata?.namespace),
          }
        : null;
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) return result.value;
  }
  return null;
}
