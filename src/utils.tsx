import { Chip } from '@mui/material';

export function age(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function hasCondition(resource: any, type: string): boolean {
  return (
    resource.jsonData?.status?.conditions?.some(
      (c: any) => c.type === type && c.status === 'True'
    ) ?? false
  );
}

// Returns the status string ('True' | 'False' | 'Unknown') for a condition on a KubeObject.
export function conditionStatus(resource: any, type: string): string {
  const cond = resource.jsonData?.status?.conditions?.find((c: any) => c.type === type);
  return cond?.status ?? 'Unknown';
}

// Same but for raw JSON objects (e.g. API list responses, not KubeObject wrappers).
export function rawConditionStatus(conditions: any[], type: string): string {
  const cond = conditions?.find((c: any) => c.type === type);
  return cond?.status ?? 'Unknown';
}

export function isHealthy(conditions: any[] | undefined): boolean {
  return (
    rawConditionStatus(conditions ?? [], 'Ready') === 'True' &&
    rawConditionStatus(conditions ?? [], 'Synced') === 'True'
  );
}

// Synced first: a sync failure is usually the root cause of Ready=False.
export function failingCondition(conditions: any[] | undefined): any | undefined {
  for (const type of ['Synced', 'Ready']) {
    const cond = conditions?.find((c: any) => c.type === type);
    if (cond && cond.status !== 'True') return cond;
  }
  return undefined;
}

// The most actionable message: a failing Synced message, else a failing Ready one.
export function debugMessage(conditions: any[] | undefined): string | null {
  for (const type of ['Synced', 'Ready']) {
    const cond = conditions?.find((c: any) => c.type === type);
    if (cond && cond.status !== 'True' && cond.message) return cond.message;
  }
  return null;
}

// Stable sort that puts unhealthy items first, then applies the tiebreak.
export function sortFailingFirst<T>(
  items: T[],
  isOk: (item: T) => boolean,
  tiebreak: (a: T, b: T) => number = () => 0
): T[] {
  return [...items].sort((a, b) => Number(isOk(a)) - Number(isOk(b)) || tiebreak(a, b));
}

export function readySyncedStatusLabel(ready: string, synced: string): string {
  if (ready === 'True' && synced === 'True') return 'Ready';
  if (synced !== 'True') return 'Sync Failed';
  if (ready !== 'True') return 'Not Ready';
  return 'Unknown';
}

export function getReferenceableVersion(spec: any): string {
  const versions: any[] = spec?.versions ?? [];
  return versions.find(v => v.referenceable)?.name ?? versions[0]?.name ?? 'v1';
}

// Green = True, Red = False, Yellow = Unknown / missing / transitioning.
export function StatusChip({ status }: { status: string | undefined }) {
  if (status === 'True') return <Chip size="small" label="True" color="success" />;
  if (status === 'False') return <Chip size="small" label="False" color="error" />;
  return <Chip size="small" label={status ?? 'Unknown'} color="warning" />;
}
