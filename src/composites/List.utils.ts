export interface XRRow {
  name: string;
  kind: string;
  group: string;
  version: string;
  plural: string;
  ready: string;
  synced: string;
  creationTimestamp: string;
}

export function sortByReady(rows: XRRow[]): XRRow[] {
  return [...rows].sort((a, b) => {
    const aOk = a.ready === 'True' && a.synced === 'True';
    const bOk = b.ready === 'True' && b.synced === 'True';
    if (aOk !== bOk) return Number(aOk) - Number(bOk);
    return a.name.localeCompare(b.name);
  });
}
