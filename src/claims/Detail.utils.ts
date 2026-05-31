import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

export function claimStatusLabel(ready: string, synced: string): string {
  if (ready === 'True' && synced === 'True') return 'Ready';
  if (synced !== 'True') return 'Sync Failed';
  if (ready !== 'True') return 'Not Ready';
  return 'Unknown';
}

export async function fetchXRResourceRefs(resourceRef: any): Promise<any[] | null> {
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
