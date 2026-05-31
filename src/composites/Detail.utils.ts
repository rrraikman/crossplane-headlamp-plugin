export function compositeStatusLabel(ready: string, synced: string): string {
  if (ready === 'True' && synced === 'True') return 'Ready';
  if (synced !== 'True') return 'Sync Failed';
  if (ready !== 'True') return 'Not Ready';
  return 'Unknown';
}
