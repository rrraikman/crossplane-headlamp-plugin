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

export function buildNotReadyInstances(
  xrs: any[] | null,
  claims: any[] | null,
  xrKind: string,
  claimKind: string
): NotReadyInstance[] {
  const rows: NotReadyInstance[] = [];

  for (const r of xrs ?? []) {
    const conds = r.status?.conditions ?? [];
    if (!isReady(conds)) {
      const failing = conds.find((c: any) => c.status !== 'True');
      rows.push({
        instanceKind: xrKind,
        name: r.metadata.name,
        namespace: '—',
        reason: failing?.reason ?? 'Unknown',
        message: debugMessage(conds) ?? 'No message reported',
      });
    }
  }

  for (const r of claims ?? []) {
    const conds = r.status?.conditions ?? [];
    if (!isReady(conds)) {
      const failing = conds.find((c: any) => c.status !== 'True');
      rows.push({
        instanceKind: claimKind,
        name: r.metadata.name,
        namespace: r.metadata.namespace ?? '—',
        reason: failing?.reason ?? 'Unknown',
        message: debugMessage(conds) ?? 'No message reported',
      });
    }
  }

  return rows;
}
