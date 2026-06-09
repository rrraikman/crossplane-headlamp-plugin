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
