import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Paper, Tooltip, Typography, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { CrossplaneInfoButton } from './components/CrossplaneInfoDialog';
import { CompositeResourceDefinition, Composition, Configuration, Provider } from './resources';
import { getReferenceableVersion, hasCondition } from './utils';

function countReady(resources: any[] | null, condType: string): number | null {
  return resources === null ? null : resources.filter(r => hasCondition(r, condType)).length;
}

// ── Not Ready Panel ───────────────────────────────────────────────────────────

interface DetailRoute {
  routeName: string;
  params?: Record<string, string>;
}

interface NotReadyEntry {
  kind: string;
  name: string;
  conditionType: string;
  reason: string;
  message: string;
  detailRoute?: DetailRoute;
}

function resolveDetailRoute(entry: NotReadyEntry): DetailRoute | null {
  if (entry.detailRoute) return entry.detailRoute;
  if (entry.kind === 'Provider')
    return { routeName: 'crossplane-provider-detail', params: { name: entry.name } };
  if (entry.kind === 'Configuration')
    return { routeName: 'crossplane-configuration-detail', params: { name: entry.name } };
  if (entry.kind === 'CompositeResourceDefinition')
    return { routeName: 'crossplane-xrd-detail', params: { name: entry.name } };
  return null;
}

function collectNotReady(
  resources: any[] | null,
  kind: string,
  watchConditions: string[]
): NotReadyEntry[] {
  if (!resources) return [];
  const entries: NotReadyEntry[] = [];
  for (const r of resources) {
    const conditions: any[] = r.jsonData?.status?.conditions ?? [];
    for (const condType of watchConditions) {
      const cond = conditions.find((c: any) => c.type === condType);
      if (!cond || cond.status !== 'True') {
        entries.push({
          kind,
          name: r.metadata.name,
          conditionType: condType,
          reason: cond?.reason ?? 'Unknown',
          message: cond?.message ?? 'No message reported',
        });
        break;
      }
    }
  }
  return entries;
}

function NotReadyPanel({ items }: { items: NotReadyEntry[] }) {
  return (
    <SectionBox title="Not Ready">
      <SimpleTable
        columns={[
          { label: 'Kind', getter: (r: NotReadyEntry) => r.kind },
          {
            label: 'Name',
            getter: (r: NotReadyEntry) => {
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
          { label: 'Condition', getter: (r: NotReadyEntry) => r.conditionType },
          {
            label: 'Reason',
            getter: (r: NotReadyEntry) => (
              <Chip size="small" label={r.reason} color="error" variant="outlined" />
            ),
          },
          {
            label: 'Message',
            getter: (r: NotReadyEntry) => (
              <Tooltip title={r.message} placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: 500, cursor: 'default', fontFamily: 'monospace' }}
                >
                  {r.message}
                </Typography>
              </Tooltip>
            ),
          },
        ]}
        data={items}
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
  const [failingXrs, setFailingXrs] = useState<NotReadyEntry[]>([]);
  const [claimsStats, setClaimsStats] = useState<{ total: number; ready: number } | null>(null);

  const xrdsKey = useMemo(
    () => xrds?.map(x => x.metadata.name).sort().join(',') ?? '',
    [xrds]
  );

  // Fan out to all XRD groups and collect unhealthy composite resources.
  useEffect(() => {
    if (!xrds || xrds.length === 0) { setFailingXrs([]); return; }

    async function fetchFailingXrs() {
      const results = await Promise.all(
        xrds!.map(async xrd => {
          const spec = xrd.jsonData.spec;
          const group = spec.group;
          const version = getReferenceableVersion(spec);
          const plural = spec.names.plural;
          const kind = spec.names.kind;

          try {
            const data: any = await request(`/apis/${group}/${version}/${plural}`);
            return (data.items ?? [])
              .filter((item: any) => {
                const conds = item.status?.conditions ?? [];
                return (
                  conds.find((c: any) => c.type === 'Ready')?.status !== 'True' ||
                  conds.find((c: any) => c.type === 'Synced')?.status !== 'True'
                );
              })
              .map((item: any): NotReadyEntry => {
                const conds = item.status?.conditions ?? [];
                const failing = conds.find(
                  (c: any) => c.status !== 'True' && (c.type === 'Synced' || c.type === 'Ready')
                );
                return {
                  kind,
                  name: item.metadata.name,
                  conditionType: failing?.type ?? 'Ready',
                  reason: failing?.reason ?? 'Unknown',
                  message: failing?.message ?? 'No message reported',
                  detailRoute: {
                    routeName: 'crossplane-composite-detail',
                    params: { group, version, plural, name: item.metadata.name },
                  },
                };
              });
          } catch {
            return [];
          }
        })
      );
      setFailingXrs(results.flat());
    }

    fetchFailingXrs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  // Fan out to XRDs with claim types and tally ready/total counts.
  useEffect(() => {
    if (!xrds) return;
    const claimXrds = xrds.filter(x => !!x.jsonData.spec.claimNames?.plural);
    if (claimXrds.length === 0) { setClaimsStats({ total: 0, ready: 0 }); return; }

    async function fetchClaimsStats() {
      const results = await Promise.all(
        claimXrds.map(async xrd => {
          const spec = xrd.jsonData.spec;
          const group = spec.group;
          const version = getReferenceableVersion(spec);
          const plural = spec.claimNames.plural;
          try {
            const data: any = await request(`/apis/${group}/${version}/${plural}`);
            const items: any[] = data.items ?? [];
            const ready = items.filter(
              item => item.status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True'
            ).length;
            return { total: items.length, ready };
          } catch {
            return { total: 0, ready: 0 };
          }
        })
      );
      setClaimsStats({
        total: results.reduce((s, r) => s + r.total, 0),
        ready: results.reduce((s, r) => s + r.ready, 0),
      });
    }

    fetchClaimsStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  const notReadyItems: NotReadyEntry[] = [
    ...collectNotReady(providers, 'Provider', ['Installed', 'Healthy']),
    ...collectNotReady(configurations, 'Configuration', ['Installed', 'Healthy']),
    ...collectNotReady(xrds, 'CompositeResourceDefinition', ['Established']),
    ...failingXrs,
  ];

  return (
    <Box pb={6}>
      <Box display="flex" justifyContent="flex-end" px={2} pt={1}>
        <CrossplaneInfoButton />
      </Box>

      <Box display="flex" gap={2} px={2} pb={2}>
        <StatCard title="Claims" total={claimsStats?.total ?? null} ready={claimsStats?.ready ?? null} routeName="crossplane-claims" />
        <StatCard title="Compositions" total={compositions?.length ?? null} routeName="crossplane-compositions" />
        <StatCard title="XRDs" total={xrds?.length ?? null} ready={countReady(xrds, 'Established')} routeName="crossplane-xrds" />
        <StatCard title="Configurations" total={configurations?.length ?? null} ready={countReady(configurations, 'Healthy')} routeName="crossplane-packages" />
        <StatCard title="Providers" total={providers?.length ?? null} ready={countReady(providers, 'Healthy')} routeName="crossplane-packages" />
      </Box>

      <NotReadyPanel items={notReadyItems} />

    </Box>
  );
}
