export function packageStatusLabel(installed: string, healthy: string): string {
  if (installed === 'True' && healthy === 'True') return 'Healthy';
  if (installed !== 'True') return 'Not Installed';
  return 'Unhealthy';
}
