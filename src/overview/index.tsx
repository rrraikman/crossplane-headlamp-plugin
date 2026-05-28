import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
  TileChart,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import { CrossplaneInfoButton } from '../components/CrossplaneInfoDialog';
import { CompositeResourceDefinition, Composition, Configuration, Provider } from '../resources';
import { age, conditionStatus, hasCondition, StatusChip } from '../utils';

// --- Not Ready Panel ---

interface NotReadyEntry {
  kind: string;
  name: string;
  conditionType: string;
  reason: string;
  message: string;
}

interface DetailRoute {
  routeName: string;
  params?: Record<string, string>;
}

function notReadyDetailRoute(kind: string, name: string): DetailRoute | null {
  if (kind === 'Provider') return { routeName: 'crossplane-provider-detail', params: { name } };
  if (kind === 'Configuration')
    return { routeName: 'crossplane-configuration-detail', params: { name } };
  if (kind === 'CompositeResourceDefinition')
    return { routeName: 'crossplane-xrd-detail', params: { name } };
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
  if (items.length === 0) return null;

  return (
    <SectionBox title="Not Ready">
      <SimpleTable
        columns={[
          { label: 'Kind', getter: (r: NotReadyEntry) => r.kind },
          {
            label: 'Name',
            getter: (r: NotReadyEntry) => {
              const route = notReadyDetailRoute(r.kind, r.name);
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
      />
    </SectionBox>
  );
}

// --- Tiles ---

function ResourceTile({
  title,
  resources,
  conditionType,
  routeName,
}: {
  title: string;
  resources: any[] | null;
  conditionType: string | null;
  routeName?: string;
}) {
  const theme = useTheme();
  const total = resources?.length ?? 0;

  const healthy = conditionType
    ? (resources?.filter(r => hasCondition(r, conditionType)).length ?? 0)
    : total;
  const unhealthy = total - healthy;

  const chart = conditionType ? (
    <TileChart
      data={[
        { name: 'Healthy', value: healthy, fill: theme.palette.success.main },
        { name: 'Unhealthy', value: unhealthy, fill: theme.palette.error.main },
      ]}
      total={total}
      label={resources ? `${healthy}/${total}` : '—'}
      title={title}
    />
  ) : (
    <TileChart
      data={[{ name: title, value: 100, fill: theme.palette.primary.main }]}
      total={100}
      label={resources ? String(total) : '—'}
      title={title}
    />
  );

  if (routeName) {
    return (
      <HeadlampLink routeName={routeName} style={{ textDecoration: 'none' }}>
        <Box sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>{chart}</Box>
      </HeadlampLink>
    );
  }

  return chart;
}

// --- Package Tables ---

function PackageTable({
  title,
  resources,
  detailRouteName,
}: {
  title: string;
  resources: any[] | null;
  detailRouteName?: string;
}) {
  return (
    <SectionBox title={title}>
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: any) =>
              detailRouteName ? (
                <HeadlampLink routeName={detailRouteName} params={{ name: r.metadata.name }}>
                  {r.metadata.name}
                </HeadlampLink>
              ) : (
                r.metadata.name
              ),
          },
          { label: 'Package', getter: (r: any) => r.jsonData.spec?.package ?? '—' },
          {
            label: 'Installed',
            getter: (r: any) => <StatusChip status={conditionStatus(r, 'Installed')} />,
          },
          {
            label: 'Healthy',
            getter: (r: any) => <StatusChip status={conditionStatus(r, 'Healthy')} />,
          },
          {
            label: 'Age',
            getter: (r: any) => age(r.metadata.creationTimestamp),
          },
        ]}
        data={resources}
        emptyMessage={`No ${title.toLowerCase()} found`}
      />
    </SectionBox>
  );
}

// --- Overview ---

export function CrossplaneOverview() {
  const [providers] = Provider.useList();
  const [configurations] = Configuration.useList();
  const [xrds] = CompositeResourceDefinition.useList();
  const [compositions] = Composition.useList();

  const notReadyItems: NotReadyEntry[] = [
    ...collectNotReady(providers, 'Provider', ['Installed', 'Healthy']),
    ...collectNotReady(configurations, 'Configuration', ['Installed', 'Healthy']),
    ...collectNotReady(xrds, 'CompositeResourceDefinition', ['Established']),
  ];

  return (
    <Box pb={6}>
      <Box display="flex" justifyContent="flex-end" px={2} pt={1}>
        <CrossplaneInfoButton />
      </Box>
      <NotReadyPanel items={notReadyItems} />
      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" p={2} gap={2}
        sx={{ '& > *': { display: 'flex', justifyContent: 'center' } }}
      >
        <ResourceTile title="Providers" resources={providers} conditionType="Healthy" />
        <ResourceTile title="Configurations" resources={configurations} conditionType="Healthy" />
        <ResourceTile title="Composite Resource Definitions" resources={xrds} conditionType="Established" />
        <ResourceTile title="Compositions" resources={compositions} conditionType={null} />
      </Box>
      <PackageTable
        title="Providers"
        resources={providers}
        detailRouteName="crossplane-provider-detail"
      />
      <PackageTable
        title="Configurations"
        resources={configurations}
        detailRouteName="crossplane-configuration-detail"
      />
      <SectionBox title="Compositions">
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (r: any) => (
                <HeadlampLink routeName="crossplane-composition-detail" params={{ name: r.metadata.name }}>
                  {r.metadata.name}
                </HeadlampLink>
              ),
            },
            { label: 'Composite Type', getter: (r: any) => r.jsonData.spec?.compositeTypeRef?.kind ?? '—' },
            { label: 'Mode', getter: (r: any) => r.jsonData.spec?.mode ?? 'Resources' },
            { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
          ]}
          data={compositions}
          emptyMessage="No compositions found"
        />
      </SectionBox>
    </Box>
  );
}
