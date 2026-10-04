import { sortFailingFirst } from '../utils';

export interface XRRow {
  name: string;
  namespace?: string;
  kind: string;
  group: string;
  version: string;
  plural: string;
  ready: string;
  synced: string;
  creationTimestamp: string;
}

export function sortByReady(rows: XRRow[]): XRRow[] {
  return sortFailingFirst(
    rows,
    r => r.ready === 'True' && r.synced === 'True',
    (a, b) => (a.namespace ?? '').localeCompare(b.namespace ?? '') || a.name.localeCompare(b.name)
  );
}
