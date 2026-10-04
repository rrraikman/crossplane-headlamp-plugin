import { Link as HeadlampLink, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { detailRouteParams, parseApiVersion } from '../discovery';
import { age, rawConditionStatus, StatusChip } from '../utils';
import { debugMessage, fetchReferencedResources, ResourceRef, scopeRefs } from './ManagedResources.utils';

function detailParams(r: any): Record<string, string> | null {
  const apiVersion = r.__apiVersion ?? r.apiVersion ?? '';
  // Core/legacy resources (empty group, e.g. a raw Service) aren't routable
  // via this CRD-shaped detail route.
  if (!parseApiVersion(apiVersion).group) return null;
  return detailRouteParams(
    apiVersion,
    r.__plural ?? (r.__kind ?? r.kind).toLowerCase() + 's',
    r.metadata.name,
    r.metadata.namespace
  );
}

export function ManagedResources({
  resourceRefs,
  namespace,
}: {
  resourceRefs: ResourceRef[] | undefined;
  namespace?: string;
}) {
  const [mrs, setMrs] = useState<any[] | null>(null);
  const filterFunction = useFilterFunc();

  const refsKey = JSON.stringify(scopeRefs(resourceRefs, namespace));
  const scopedRefs = useMemo<ResourceRef[]>(() => JSON.parse(refsKey), [refsKey]);

  useEffect(() => {
    if (scopedRefs.length === 0) {
      setMrs([]);
      return;
    }
    let cancelled = false;
    fetchReferencedResources(scopedRefs).then(items => {
      if (!cancelled) setMrs(items);
    });
    return () => {
      cancelled = true;
    };
  }, [scopedRefs]);

  const sorted = mrs
    ? [...mrs].sort((a, b) => {
        const aOk = rawConditionStatus(a.status?.conditions ?? [], 'Ready') === 'True';
        const bOk = rawConditionStatus(b.status?.conditions ?? [], 'Ready') === 'True';
        return Number(aOk) - Number(bOk);
      })
    : null;

  return (
    <SectionBox title={`Managed Resources (${mrs?.length ?? '…'})`}>
      <Table
        columns={[
          { header: 'Kind', accessorFn: (r: any) => r.__kind ?? r.kind },
          {
            header: 'Name',
            accessorFn: (r: any) => r.metadata.name,
            Cell: ({ row }: any) => {
              const r = row.original;
              const params = detailParams(r);
              if (!params) return r.metadata.name;
              return (
                <HeadlampLink routeName="crossplane-managed-detail" params={params}>
                  {r.metadata.name}
                </HeadlampLink>
              );
            },
          },
          {
            header: 'Ready',
            accessorFn: (r: any) => rawConditionStatus(r.status?.conditions ?? [], 'Ready'),
            Cell: ({ row }: any) => (
              <StatusChip status={rawConditionStatus(row.original.status?.conditions ?? [], 'Ready')} />
            ),
          },
          {
            header: 'Synced',
            accessorFn: (r: any) => rawConditionStatus(r.status?.conditions ?? [], 'Synced'),
            Cell: ({ row }: any) => (
              <StatusChip status={rawConditionStatus(row.original.status?.conditions ?? [], 'Synced')} />
            ),
          },
          {
            header: 'Message',
            accessorFn: (r: any) => debugMessage(r.status?.conditions ?? []) ?? '—',
            Cell: ({ row }: any) => {
              const r = row.original;
              const msg = debugMessage(r.status?.conditions ?? []);
              if (!msg) return '—';
              const params = detailParams(r);
              const text = (
                <Tooltip title={msg} placement="top-start">
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ maxWidth: 480, cursor: params ? 'pointer' : 'default', fontFamily: 'monospace', color: 'error.main' }}
                  >
                    {msg}
                  </Typography>
                </Tooltip>
              );
              if (!params) return text;
              return (
                <HeadlampLink
                  routeName="crossplane-managed-detail"
                  params={params}
                  style={{ textDecoration: 'none' }}
                >
                  {text}
                </HeadlampLink>
              );
            },
          },
          { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={sorted ?? []}
        loading={sorted === null}
        filterFunction={filterFunction}
        emptyMessage="No managed resources found"
      />
    </SectionBox>
  );
}
