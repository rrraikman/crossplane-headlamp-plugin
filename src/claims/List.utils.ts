import { sortFailingFirst } from '../utils';

export interface ClaimRow {
  name: string;
  namespace: string;
  kind: string;
  group: string;
  version: string;
  plural: string;
  ready: string;
  synced: string;
  message: string | null;
  creationTimestamp: string;
}

export function sortByReady(rows: ClaimRow[]): ClaimRow[] {
  return sortFailingFirst(
    rows,
    r => r.ready === 'True' && r.synced === 'True',
    (a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name)
  );
}
