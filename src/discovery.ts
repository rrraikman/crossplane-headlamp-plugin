import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

export interface ApiResourceInfo {
  plural: string;
  // undefined when discovery failed and the scope is unknown.
  namespaced: boolean | undefined;
}

// Core/legacy API resources (ConfigMap, Service, etc.) have no group segment
// in their apiVersion (e.g. "v1" rather than "group/version").
export function parseApiVersion(apiVersion: string): { group: string; version: string } {
  const slashIdx = apiVersion.lastIndexOf('/');
  return slashIdx >= 0
    ? { group: apiVersion.slice(0, slashIdx), version: apiVersion.slice(slashIdx + 1) }
    : { group: '', version: apiVersion };
}

export function apiGroupPath(apiVersion: string): string {
  const { group, version } = parseApiVersion(apiVersion);
  return group ? `/apis/${group}/${version}` : `/api/${version}`;
}

export function resourcePath(
  apiVersion: string,
  plural: string,
  opts?: { namespace?: string; name?: string }
): string {
  const parts = [apiGroupPath(apiVersion)];
  if (opts?.namespace) parts.push('namespaces', opts.namespace);
  parts.push(plural);
  if (opts?.name) parts.push(opts.name);
  return parts.join('/');
}

// Route params for the composite/managed detail routes. The namespace key is
// omitted entirely for cluster-scoped resources because generatePath rejects
// an empty string for the optional :namespace? segment.
export function detailRouteParams(
  apiVersion: string,
  plural: string,
  name: string,
  namespace?: string
): Record<string, string> {
  const { group, version } = parseApiVersion(apiVersion);
  return { group, version, plural, name, ...(namespace ? { namespace } : {}) };
}

const discoveryCache = new Map<string, ApiResourceInfo>();

export async function discoverResource(apiVersion: string, kind: string): Promise<ApiResourceInfo> {
  const cacheKey = `${apiVersion}/${kind}`;
  const cached = discoveryCache.get(cacheKey);
  if (cached) return cached;

  const fallback: ApiResourceInfo = { plural: kind.toLowerCase() + 's', namespaced: undefined };
  try {
    const data = await request(apiGroupPath(apiVersion));
    const resource = (data.resources ?? []).find(
      (r: any) => r.kind === kind && !r.name.includes('/')
    );
    if (!resource) return fallback;
    const info: ApiResourceInfo = { plural: resource.name, namespaced: resource.namespaced };
    discoveryCache.set(cacheKey, info);
    return info;
  } catch {
    return fallback;
  }
}

export function clearDiscoveryCache() {
  discoveryCache.clear();
}
