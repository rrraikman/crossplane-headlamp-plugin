import { debugMessage, failingCondition, isHealthy, sortFailingFirst } from '../utils';

export function sortByReady(items: any[]): any[] {
  return sortFailingFirst(items, r => isHealthy(r.status?.conditions));
}

export interface NotReadyInstance {
  instanceKind: string;
  name: string;
  namespace: string;
  reason: string;
  message: string;
}

export function buildNotReadyInstances(
  xrs: any[] | null,
  claims: any[] | null,
  xrKind: string,
  claimKind: string
): NotReadyInstance[] {
  const rows: NotReadyInstance[] = [];
  const collect = (items: any[] | null, instanceKind: string) => {
    for (const r of items ?? []) {
      const conds = r.status?.conditions ?? [];
      if (isHealthy(conds)) continue;
      rows.push({
        instanceKind,
        name: r.metadata.name,
        namespace: r.metadata.namespace ?? '—',
        reason: failingCondition(conds)?.reason ?? 'Unknown',
        message: debugMessage(conds) ?? 'No message reported',
      });
    }
  };
  collect(xrs, xrKind);
  collect(claims, claimKind);
  return rows;
}
