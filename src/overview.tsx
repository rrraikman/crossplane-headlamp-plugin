import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Chip, Paper, Tooltip, Typography, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { CrossplaneInfoButton } from './components/CrossplaneInfoDialog';
import { detailRouteParams, parseApiVersion } from './discovery';
import {
  countInstances,
  crdToMRType,
  fetchManagedResourceCRDs,
  mapWithConcurrency,
  mrListPath,
} from './managed/List.utils';
import {
  collectNotReady,
  countReady,
  countReadyWhenReported,
  NotReadyEntry,
  resolveDetailRoute,
} from './overview.utils';
import { CompositeResourceDefinition, Composition, Configuration, Provider } from './resources';
import { failingCondition, isHealthy, rawConditionStatus } from './utils';
import { useXRDInstanceLists } from './xrdInstances';

function NotReadyPanel({ items }: { items: NotReadyEntry[] }) {
  const filterFunction = useFilterFunc<NotReadyEntry>();

  return (
    <SectionBox title="Not Ready">
      <Table
        columns={[
          { header: 'Kind', accessorFn: (r: NotReadyEntry) => r.kind },
          {
            header: 'Name',
            accessorFn: (r: NotReadyEntry) => r.name,
            Cell: ({ row }: any) => {
              const r: NotReadyEntry = row.original;
              const route = resolveDetailRoute(r);
              return route ? (
                <HeadlampLink routeName={route.routeName} params={route.params}>
                  {r.name}
                </HeadlampLink>
              ) : (
                r.name
              );
            },
          },
          { header: 'Condition', accessorFn: (r: NotReadyEntry) => r.conditionType },
          {
            header: 'Reason',
            accessorFn: (r: NotReadyEntry) => r.reason,
            Cell: ({ row }: any) => (
              <Chip size="small" label={row.original.reason} color="error" variant="outlined" />
            ),
          },
          {
            header: 'Message',
            accessorFn: (r: NotReadyEntry) => r.message,
            Cell: ({ row }: any) => {
              const r: NotReadyEntry = row.original;
              const route = resolveDetailRoute(r);
              const text = (
                <Tooltip title={r.message} placement="top-start">
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ maxWidth: 500, cursor: route ? 'pointer' : 'default', fontFamily: 'monospace', ...(route ? { color: 'error.main' } : {}) }}
                  >
                    {r.message}
                  </Typography>
                </Tooltip>
              );
              return route ? (
                <HeadlampLink routeName={route.routeName} params={route.params} style={{ textDecoration: 'none' }}>
                  {text}
                </HeadlampLink>
              ) : text;
            },
          },
        ]}
        data={items}
        filterFunction={filterFunction}
        emptyMessage="All resources are ready"
      />
    </SectionBox>
  );
}

// ── Tiles ─────────────────────────────────────────────────────────────────────

function StatCard({
  title,
  total,
  ready,
  routeName,
}: {
  title: string;
  total: number | null;
  ready?: number | null;
  routeName?: string;
}) {
  const theme = useTheme();
  const loading = total === null || ready === null;
  const borderColor = loading
    ? theme.palette.divider
    : ready === undefined
      ? theme.palette.primary.main
      : ready === total
        ? theme.palette.success.main
        : theme.palette.warning.main;
  const sublabel = loading
    ? 'Loading…'
    : ready !== undefined
      ? `${ready} / ${total} ready`
      : `${total} total`;

  const card = (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2.5,
        borderTop: `3px solid ${borderColor}`,
        '&:hover': routeName ? { bgcolor: 'action.hover' } : {},
        cursor: routeName ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
      }}
    >
      <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.4}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} mt={1} lineHeight={1}>
        {loading ? '—' : total}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
        {sublabel}
      </Typography>
    </Paper>
  );

  return (
    <Box flex={1}>
      {routeName ? (
        <HeadlampLink routeName={routeName} style={{ textDecoration: 'none', display: 'block' }}>
          {card}
        </HeadlampLink>
      ) : card}
    </Box>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

export function CrossplaneOverview() {
  const [providers] = Provider.useList();
  const [configurations] = Configuration.useList();
  const [xrds] = CompositeResourceDefinition.useList();
  const [compositions] = Composition.useList();
  const [mrStats, setMrStats] = useState<{ total: number; ready: number } | null>(null);
  const xrInstances = useXRDInstanceLists(xrds, 'composite');
  const claimInstances = useXRDInstanceLists(xrds, 'claim');

  // Unhealthy composite resources across every XRD.
  const failingXrs = useMemo<NotReadyEntry[]>(
    () =>
      (xrInstances.lists ?? []).flatMap(({ xrd, group, version, plural, kind, items }) =>
        items
          .filter((item: any) => !isHealthy(item.status?.conditions))
          .map((item: any): NotReadyEntry => {
            const failing = failingCondition(item.status?.conditions);
            const entry = {
              conditionType: failing?.type ?? 'Ready',
              reason: failing?.reason ?? 'Unknown',
              message: failing?.message || 'No message reported',
            };

            // If this XR was created from a claim, surface the claim instead.
            // Claims are the user-facing concept; XRs are an implementation detail.
            const claimRef = item.spec?.crossplane?.claimRef ?? item.spec?.claimRef;
            if (claimRef?.name) {
              const claimApi = parseApiVersion(claimRef.apiVersion ?? '');
              return {
                ...entry,
                kind: claimRef.kind ?? kind,
                name: claimRef.name,
                detailRoute: {
                  routeName: 'crossplane-claim-detail',
                  params: {
                    group: claimApi.group || group,
                    version: claimApi.version || version,
                    plural:
                      xrd.jsonData.spec.claimNames?.plural ??
                      `${(claimRef.kind ?? '').toLowerCase()}s`,
                    namespace: claimRef.namespace ?? 'default',
                    name: claimRef.name,
                  },
                },
              };
            }

            return {
              ...entry,
              kind,
              name: item.metadata.namespace
                ? `${item.metadata.namespace}/${item.metadata.name}`
                : item.metadata.name,
              detailRoute: {
                routeName: 'crossplane-composite-detail',
                params: detailRouteParams(
                  `${group}/${version}`,
                  plural,
                  item.metadata.name,
                  item.metadata.namespace
                ),
              },
            };
          })
      ),
    [xrInstances.lists]
  );

  const claimsStats = useMemo(() => {
    if (!claimInstances.lists) return null;
    const items = claimInstances.lists.flatMap(l => l.items);
    const ready = items.filter(
      (item: any) => rawConditionStatus(item.status?.conditions, 'Ready') === 'True'
    ).length;
    return { total: items.length, ready };
  }, [claimInstances.lists]);

  // Discover managed resource CRDs and tally ready/total counts. Counting is
  // cheap (limit=1); only types that have instances are listed in full to read
  // their Ready conditions.
  useEffect(() => {
    let cancelled = false;

    async function fetchMrStats() {
      try {
        const types = (await fetchManagedResourceCRDs()).map(crdToMRType);
        const totals = await mapWithConcurrency(types, 8, t =>
          cancelled ? Promise.resolve(0) : countInstances(t).catch(() => 0)
        );
        const populated = types.filter((_, i) => totals[i] > 0);
        const readyCounts = await mapWithConcurrency(populated, 8, async t => {
          if (cancelled) return 0;
          try {
            const data: any = await request(mrListPath(t));
            return (data.items ?? []).filter(
              (item: any) =>
                item.status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True'
            ).length;
          } catch {
            return 0;
          }
        });
        if (cancelled) return;
        setMrStats({
          total: totals.reduce((s, n) => s + n, 0),
          ready: readyCounts.reduce((s, n) => s + n, 0),
        });
      } catch {
        if (!cancelled) setMrStats({ total: 0, ready: 0 });
      }
    }

    fetchMrStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const notReadyItems: NotReadyEntry[] = [
    ...collectNotReady(providers, 'Provider', ['Installed', 'Healthy']),
    ...collectNotReady(configurations, 'Configuration', ['Installed', 'Healthy']),
    ...collectNotReady(xrds, 'CompositeResourceDefinition', ['Established']),
    ...collectNotReady(compositions, 'Composition', ['Ready'], { skipIfMissing: true }),
    ...failingXrs,
  ];

  return (
    <Box pb={6}>
      {xrInstances.watchers}
      {claimInstances.watchers}
      <Box display="flex" justifyContent="flex-end" px={2} pt={1}>
        <CrossplaneInfoButton />
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} px={2} pb={2}>
        <StatCard title="Claims" total={claimsStats?.total ?? null} ready={claimsStats?.ready ?? null} routeName="crossplane-claims" />
        <StatCard title="Compositions" total={compositions?.length ?? null} ready={countReadyWhenReported(compositions, 'Ready')} routeName="crossplane-compositions" />
        <StatCard title="XRDs" total={xrds?.length ?? null} ready={countReady(xrds, 'Established')} routeName="crossplane-xrds" />
        <StatCard title="Providers" total={providers?.length ?? null} ready={countReady(providers, 'Healthy')} routeName="crossplane-packages" />
        <StatCard title="Configurations" total={configurations?.length ?? null} ready={countReady(configurations, 'Healthy')} routeName="crossplane-packages" />
        <StatCard title="Managed Resources" total={mrStats?.total ?? null} ready={mrStats?.ready ?? null} routeName="crossplane-managed-resources" />
      </Box>

      <NotReadyPanel items={notReadyItems} />

    </Box>
  );
}
