import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { discoverResource, resourcePath } from '../discovery';

export interface ResourceRef {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
}

// Crossplane v2 namespaced XRs record composed resources without a namespace
// because they always live in the XR's own namespace.
export function scopeRefs(refs: ResourceRef[] | undefined, ownerNamespace?: string): ResourceRef[] {
  return (refs ?? [])
    .filter(r => r?.apiVersion && r.kind && r.name)
    .map(r => ({ ...r, namespace: r.namespace ?? ownerNamespace }));
}

export function refMatches(ref: ResourceRef, item: any, namespaced: boolean | undefined): boolean {
  if (item.metadata?.name !== ref.name) return false;
  if (namespaced === false || !ref.namespace || !item.metadata?.namespace) return true;
  return item.metadata.namespace === ref.namespace;
}

// One list call per apiVersion+kind. Items are tagged with __apiVersion, __kind
// and __plural because list responses for built-in types omit apiVersion/kind.
export async function fetchReferencedResources(refs: ResourceRef[]): Promise<any[]> {
  const groups = new Map<string, { apiVersion: string; kind: string; refs: ResourceRef[] }>();
  for (const ref of refs) {
    const key = `${ref.apiVersion}/${ref.kind}`;
    if (!groups.has(key)) groups.set(key, { apiVersion: ref.apiVersion, kind: ref.kind, refs: [] });
    groups.get(key)!.refs.push(ref);
  }

  const results = await Promise.all(
    [...groups.values()].map(async ({ apiVersion, kind, refs: groupRefs }) => {
      const { plural, namespaced } = await discoverResource(apiVersion, kind);
      const namespaces = new Set(groupRefs.map(r => r.namespace));
      const listNamespace =
        namespaced === true && namespaces.size === 1 ? [...namespaces][0] : undefined;
      try {
        const data = await request(resourcePath(apiVersion, plural, { namespace: listNamespace }));
        return (data.items ?? [])
          .filter((item: any) => groupRefs.some(ref => refMatches(ref, item, namespaced)))
          .map((item: any) => ({ ...item, __apiVersion: apiVersion, __kind: kind, __plural: plural }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}
