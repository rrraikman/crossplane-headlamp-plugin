export function isReady(conditions: any[]): boolean {
  return conditions?.find((c: any) => c.type === 'Ready')?.status === 'True';
}

// Returns the most actionable error message: Synced failure first, then Ready failure.
export function debugMessage(conditions: any[]): string | null {
  const synced = conditions?.find((c: any) => c.type === 'Synced');
  if (synced && synced.status !== 'True' && synced.message) return synced.message;
  const ready = conditions?.find((c: any) => c.type === 'Ready');
  if (ready && ready.status !== 'True' && ready.message) return ready.message;
  return null;
}

// Sort failing instances to the top.
export function sortByReady(items: any[]): any[] {
  return [...items].sort((a, b) => {
    const aOk = isReady(a.status?.conditions ?? []);
    const bOk = isReady(b.status?.conditions ?? []);
    return Number(aOk) - Number(bOk);
  });
}

export interface NotReadyInstance {
  instanceKind: string;
  name: string;
  namespace: string;
  reason: string;
  message: string;
}

function isHealthy(conditions: any[]): boolean {
  return ['Ready', 'Synced'].every(
    type => conditions?.find((c: any) => c.type === type)?.status === 'True'
  );
}

// Synced first: a sync failure is usually the root cause of Ready=False.
function failingCondition(conditions: any[]): any | undefined {
  for (const type of ['Synced', 'Ready']) {
    const cond = conditions?.find((c: any) => c.type === type);
    if (cond && cond.status !== 'True') return cond;
  }
  return undefined;
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
