import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Link as HeadlampLink, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { age, rawConditionStatus, StatusChip } from '../utils';
import { debugMessage, resolvePlural } from './ManagedResources.utils';

interface ResourceRef {
  apiVersion: string;
  kind: string;
  name: string;
}

async function fetchMRList(apiVersion: string, kind: string, names: Set<string>): Promise<any[]> {
  const slashIdx = apiVersion.lastIndexOf('/');
  const group = slashIdx >= 0 ? apiVersion.slice(0, slashIdx) : '';
  const version = slashIdx >= 0 ? apiVersion.slice(slashIdx + 1) : apiVersion;
  const plural = await resolvePlural(apiVersion, kind);
  const path = group
    ? `/apis/${group}/${version}/${plural}`
    : `/api/${version}/${plural}`;
  try {
    const data = await request(path);
    const found = (data.items ?? [])
      .filter((r: any) => names.has(r.metadata.name))
      .map((r: any) => ({ ...r, __plural: plural }));
    return found;
  } catch {
    return [];
  }
}

export function ManagedResources({ resourceRefs }: { resourceRefs: ResourceRef[] | undefined }) {
  const [mrs, setMrs] = useState<any[] | null>(null);

  useEffect(() => {
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
