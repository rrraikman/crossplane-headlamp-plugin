import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

// Cache plural lookups so we don't repeat the same discovery call.
const pluralCache = new Map<string, string>();

export async function resolvePlural(apiVersion: string, kind: string): Promise<string> {
  const cacheKey = `${apiVersion}/${kind}`;
  if (pluralCache.has(cacheKey)) return pluralCache.get(cacheKey)!;

  const slashIdx = apiVersion.lastIndexOf('/');
  const group = slashIdx >= 0 ? apiVersion.slice(0, slashIdx) : '';
  const version = slashIdx >= 0 ? apiVersion.slice(slashIdx + 1) : apiVersion;
  const discoveryPath = group ? `/apis/${group}/${version}` : `/api/${version}`;

  try {
    const data = await request(discoveryPath);
    const resource = (data.resources ?? []).find(
      (r: any) => r.kind === kind && !r.name.includes('/')
    );
    const plural = resource?.name ?? kind.toLowerCase() + 's';
    pluralCache.set(cacheKey, plural);
    return plural;
  } catch {
    return kind.toLowerCase() + 's';
  }
}

export function debugMessage(conditions: any[]): string | null {
  const synced = conditions?.find((c: any) => c.type === 'Synced');
  if (synced && synced.status !== 'True' && synced.message) return synced.message;
  const ready = conditions?.find((c: any) => c.type === 'Ready');
  if (ready && ready.status !== 'True' && ready.message) return ready.message;
  return null;
}
