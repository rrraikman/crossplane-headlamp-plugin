import { rawConditionStatus } from '../utils';

export type NodeStatus = 'success' | 'warning' | 'error';

export function nodeStatus(conditions: any[]): NodeStatus {
  const ready = rawConditionStatus(conditions, 'Ready');
  const synced = rawConditionStatus(conditions, 'Synced');
  if (ready === 'True' && synced === 'True') return 'success';
  if (synced === 'False' || ready === 'False') return 'error';
  return 'warning';
}
