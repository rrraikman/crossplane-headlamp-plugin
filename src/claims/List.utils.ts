export interface ClaimRow {
  name: string;
  namespace: string;
  kind: string;
  group: string;
  version: string;
  plural: string;
  ready: string;
  synced: string;
  creationTimestamp: string;
}

export function sortByReady(rows: ClaimRow[]): ClaimRow[] {
  return [...rows].sort((a, b) => {
    const aOk = a.ready === 'True' && a.synced === 'True';
    const bOk = b.ready === 'True' && b.synced === 'True';
    if (aOk !== bOk) return Number(aOk) - Number(bOk);
    return a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name);
  });
}
