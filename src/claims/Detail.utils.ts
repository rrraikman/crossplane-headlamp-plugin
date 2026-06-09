import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

export async function resolveXRPlural(xrRef: any): Promise<string> {
  if (!xrRef?.apiVersion || !xrRef?.kind) return (xrRef?.kind ?? '').toLowerCase() + 's';
  const slashIdx = xrRef.apiVersion.lastIndexOf('/');
  const group = xrRef.apiVersion.slice(0, slashIdx);
  const version = xrRef.apiVersion.slice(slashIdx + 1);
  try {
    const discovery = await request(`/apis/${group}/${version}`);
    const resource = (discovery.resources ?? []).find(
      (r: any) => r.kind === xrRef.kind && !r.name.includes('/')
    );
    return resource?.name ?? xrRef.kind.toLowerCase() + 's';
  } catch {
    return xrRef.kind.toLowerCase() + 's';
  }
}

export interface XRData {
  resourceRefs: any[];
  conditions: any[];
}

export async function fetchXRData(resourceRef: any): Promise<XRData | null> {
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
    return {
      resourceRefs: xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs ?? [],
      conditions: xr.status?.conditions ?? [],
    };
  } catch {
    return null;
  }
}

export async function fetchXRResourceRefs(resourceRef: any): Promise<any[] | null> {
  const data = await fetchXRData(resourceRef);
  return data?.resourceRefs ?? null;
}

export interface FailingResource {
  kind: string;
  name: string;
  routeParams: { group: string; version: string; plural: string; name: string };
}

export async function fetchFailingManagedResource(resourceRefs: any[]): Promise<FailingResource | null> {
  if (!resourceRefs?.length) return null;

  const results = await Promise.allSettled(
    resourceRefs.map(async (ref): Promise<FailingResource | null> => {
      if (!ref.apiVersion || !ref.kind || !ref.name) return null;
      const slashIdx = ref.apiVersion.lastIndexOf('/');
      const group = ref.apiVersion.slice(0, slashIdx);
      const version = ref.apiVersion.slice(slashIdx + 1);
      const discovery = await request(`/apis/${group}/${version}`);
      const resource = (discovery.resources ?? []).find(
        (r: any) => r.kind === ref.kind && !r.name.includes('/')
      );
      const plural = resource?.name ?? ref.kind.toLowerCase() + 's';
      const obj = await request(`/apis/${group}/${version}/${plural}/${ref.name}`);
      const conditions: any[] = obj.status?.conditions ?? [];
      const failing = conditions.find(
        (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
      );
      return failing
        ? { kind: ref.kind, name: ref.name, routeParams: { group, version, plural, name: ref.name } }
        : null;
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) return result.value;
  }
  return null;
}
