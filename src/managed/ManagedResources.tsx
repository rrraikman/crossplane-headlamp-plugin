import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Link as HeadlampLink, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { age, rawConditionStatus, StatusChip } from '../utils';

interface ResourceRef {
  apiVersion: string;
  kind: string;
  name: string;
}

// Cache plural lookups so we don't repeat the same discovery call.
const pluralCache = new Map<string, string>();

async function resolvePlural(apiVersion: string, kind: string): Promise<string> {
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

async function fetchMRList(apiVersion: string, kind: string, names: Set<string>): Promise<any[]> {
  const slashIdx = apiVersion.lastIndexOf('/');
  const group = slashIdx >= 0 ? apiVersion.slice(0, slashIdx) : '';
  const version = slashIdx >= 0 ? apiVersion.slice(slashIdx + 1) : apiVersion;
  const plural = await resolvePlural(apiVersion, kind);
  const path = group
    ? `/apis/${group}/${version}/${plural}`
    : `/api/${version}/${plural}`;
  console.log('[ManagedResources] fetching list', path, 'names:', [...names]);
  try {
    const data = await request(path);
    console.log('[ManagedResources] list response items:', data.items?.length, data.items?.map((r: any) => r.metadata.name));
    const found = (data.items ?? [])
      .filter((r: any) => names.has(r.metadata.name))
      .map((r: any) => ({ ...r, __plural: plural }));
    console.log('[ManagedResources] matched:', found.length);
    return found;
  } catch (err) {
    console.error('[ManagedResources] list failed', path, err);
    return [];
  }
}

function debugMessage(conditions: any[]): string | null {
  const synced = conditions?.find((c: any) => c.type === 'Synced');
  if (synced && synced.status !== 'True' && synced.message) return synced.message;
  const ready = conditions?.find((c: any) => c.type === 'Ready');
  if (ready && ready.status !== 'True' && ready.message) return ready.message;
  return null;
}

export function ManagedResources({ resourceRefs }: { resourceRefs: ResourceRef[] | undefined }) {
  const [mrs, setMrs] = useState<any[] | null>(null);

  useEffect(() => {
    console.log('[ManagedResources] resourceRefs:', resourceRefs);
    if (!resourceRefs || resourceRefs.length === 0) {
      setMrs([]);
      return;
    }

    // Group refs by apiVersion+kind so we do one list fetch per resource type.
    const groups = new Map<string, { apiVersion: string; kind: string; names: Set<string> }>();
    for (const ref of resourceRefs) {
      const key = `${ref.apiVersion}/${ref.kind}`;
      if (!groups.has(key)) groups.set(key, { apiVersion: ref.apiVersion, kind: ref.kind, names: new Set() });
      groups.get(key)!.names.add(ref.name);
    }

    Promise.all(
      [...groups.values()].map(g => fetchMRList(g.apiVersion, g.kind, g.names))
    ).then(results => setMrs(results.flat()));
  }, [JSON.stringify(resourceRefs)]);

  const sorted = mrs
    ? [...mrs].sort((a, b) => {
        const aOk = rawConditionStatus(a.status?.conditions ?? [], 'Ready') === 'True';
        const bOk = rawConditionStatus(b.status?.conditions ?? [], 'Ready') === 'True';
        return Number(aOk) - Number(bOk);
      })
    : null;

  return (
    <SectionBox title={`Managed Resources (${mrs?.length ?? '…'})`}>
      <SimpleTable
        columns={[
          { label: 'Kind', getter: (r: any) => r.kind },
          {
            label: 'Name',
            getter: (r: any) => {
              const apiVersion: string = r.apiVersion ?? '';
              const slashIdx = apiVersion.lastIndexOf('/');
              const group = slashIdx >= 0 ? apiVersion.slice(0, slashIdx) : '';
              const version = slashIdx >= 0 ? apiVersion.slice(slashIdx + 1) : apiVersion;
              const plural = r.__plural ?? r.kind.toLowerCase() + 's';
              return (
                <HeadlampLink
                  routeName="crossplane-managed-detail"
                  params={{ group, version, plural, name: r.metadata.name }}
                >
                  {r.metadata.name}
                </HeadlampLink>
              );
            },
          },
          {
            label: 'Ready',
            getter: (r: any) => (
              <StatusChip status={rawConditionStatus(r.status?.conditions ?? [], 'Ready')} />
            ),
          },
          {
            label: 'Synced',
            getter: (r: any) => (
              <StatusChip status={rawConditionStatus(r.status?.conditions ?? [], 'Synced')} />
            ),
          },
          {
            label: 'Message',
            getter: (r: any) => {
              const msg = debugMessage(r.status?.conditions ?? []);
              return msg ? (
                <Tooltip title={msg} placement="top-start">
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
                  >
                    {msg}
                  </Typography>
                </Tooltip>
              ) : (
                '—'
              );
            },
          },
          { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={sorted}
        emptyMessage="No managed resources found"
      />
    </SectionBox>
  );
}
