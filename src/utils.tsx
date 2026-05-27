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

export function getCondition(resource: any, type: string): any | undefined {
  return resource.jsonData?.status?.conditions?.find((c: any) => c.type === type);
}

// Green = True, Red = False, Yellow = Unknown / missing / transitioning.
export function StatusChip({ status }: { status: string | undefined }) {
  if (status === 'True') return <Chip size="small" label="True" color="success" />;
  if (status === 'False') return <Chip size="small" label="False" color="error" />;
  return <Chip size="small" label={status ?? 'Unknown'} color="warning" />;
}
