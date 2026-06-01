import { hasCondition } from './utils';

export interface DetailRoute {
  routeName: string;
  params?: Record<string, string>;
}

export interface NotReadyEntry {
  kind: string;
  name: string;
  conditionType: string;
  reason: string;
  message: string;
  detailRoute?: DetailRoute;
}

export function countReady(resources: any[] | null, condType: string): number | null {
  return resources === null ? null : resources.filter(r => hasCondition(r, condType)).length;
}

// Returns null (loading), undefined (condition never reported — treat as N/A), or the ready count.
// Use this when a condition type may legitimately be absent (e.g. Crossplane v1 Compositions).
export function countReadyWhenReported(
  resources: any[] | null,
  condType: string
): number | null | undefined {
  if (resources === null) return null;
  const anyReported = resources.some(r =>
    (r.jsonData?.status?.conditions ?? []).some((c: any) => c.type === condType)
  );
  if (!anyReported) return undefined;
  return resources.filter(r => hasCondition(r, condType)).length;
}

export function resolveDetailRoute(entry: NotReadyEntry): DetailRoute | null {
  if (entry.detailRoute) return entry.detailRoute;
  if (entry.kind === 'Provider')
    return { routeName: 'crossplane-provider-detail', params: { name: entry.name } };
  if (entry.kind === 'Configuration')
    return { routeName: 'crossplane-configuration-detail', params: { name: entry.name } };
  if (entry.kind === 'CompositeResourceDefinition')
    return { routeName: 'crossplane-xrd-detail', params: { name: entry.name } };
  if (entry.kind === 'Composition')
    return { routeName: 'crossplane-composition-detail', params: { name: entry.name } };
  return null;
}

export function collectNotReady(
  resources: any[] | null,
  kind: string,
  watchConditions: string[],
  opts?: { skipIfMissing?: boolean }
): NotReadyEntry[] {
  if (!resources) return [];
  const entries: NotReadyEntry[] = [];
  for (const r of resources) {
    const conditions: any[] = r.jsonData?.status?.conditions ?? [];
    for (const condType of watchConditions) {
      const cond = conditions.find((c: any) => c.type === condType);
      if (opts?.skipIfMissing && !cond) continue;
      if (!cond || cond.status !== 'True') {
        entries.push({
          kind,
          name: r.metadata.name,
          conditionType: condType,
          reason: cond?.reason ?? 'Unknown',
          message: cond?.message || 'No message reported',
        });
        break;
      }
    }
  }
  return entries;
}
