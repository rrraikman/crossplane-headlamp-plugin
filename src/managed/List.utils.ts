import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { resourcePath } from '../discovery';

export interface MRType {
  kind: string;
  group: string;
  version: string;
  plural: string;
}

export function crdToMRType(crd: any): MRType {
  const storageVersion =
    crd.spec.versions?.find((v: any) => v.storage) ?? crd.spec.versions?.[0];
  return {
    kind: crd.spec.names.kind,
    group: crd.spec.group,
    version: storageVersion?.name ?? 'v1',
    plural: crd.spec.names.plural,
  };
}

export function typeKey(t: MRType): string {
  return `${t.group}/${t.plural}`;
}

export function mrListPath(t: MRType): string {
  return resourcePath(`${t.group}/${t.version}`, t.plural);
}

const MANAGED_CRDS_BY_LABEL =
  '/apis/apiextensions.k8s.io/v1/customresourcedefinitions?labelSelector=crossplane.io%2Fresource%3Dmanaged';

// Label selector first (server-side, small); older providers don't set the
// label, so fall back to listing every CRD and filtering by category.
export async function fetchManagedResourceCRDs(): Promise<any[]> {
  const labeled: any = await request(MANAGED_CRDS_BY_LABEL);
  if ((labeled.items ?? []).length > 0) return labeled.items;
  const all: any = await request('/apis/apiextensions.k8s.io/v1/customresourcedefinitions');
  return (all.items ?? []).filter((crd: any) =>
    (crd.spec?.names?.categories ?? []).includes('managed')
  );
}

// Counts with a single-item page instead of listing every object.
// remainingItemCount can be omitted by the API server, in which case we pay
// for a full list rather than undercount.
export async function countInstances(t: MRType): Promise<number> {
  const path = mrListPath(t);
  const page: any = await request(`${path}?limit=1`);
  const onPage = (page.items ?? []).length;
  if (typeof page.metadata?.remainingItemCount === 'number') {
    return onPage + page.metadata.remainingItemCount;
  }
  if (!page.metadata?.continue) return onPage;
  const all: any = await request(path);
  return (all.items ?? []).length;
}

// Provider families install hundreds of MR CRDs; firing one request per CRD
// at once floods the Headlamp backend and the browser connection pool.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
