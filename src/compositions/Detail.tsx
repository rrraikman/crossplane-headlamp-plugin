import { Icon } from '@iconify/react';
import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { Composition } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function CompositionDetail() {
  const { name } = useParams<{ name: string }>();
  const [composition] = Composition.useGet(name);

  if (!composition) return <Loader title="Loading..." />;

  const spec = composition.jsonData.spec ?? {};
  const conditions: any[] = composition.jsonData.status?.conditions ?? [];
  const mode: string = spec.mode ?? 'Resources';
  const pipeline: any[] = spec.pipeline ?? [];
  const resources: any[] = spec.resources ?? [];

  return (
    <Box pb={6}>
      <BackLink />

      <SectionBox title={name}>
        <NameValueTable
          rows={[
            {
              name: 'Composite Type',
              value: spec.compositeTypeRef
                ? `${spec.compositeTypeRef.apiVersion} / ${spec.compositeTypeRef.kind}`
                : '—',
            },
            { name: 'Mode', value: mode },
            {
              name: 'Ready',
              value: <StatusChip status={conditionStatus(composition, 'Ready')} />,
              hide: !conditions.some((c: any) => c.type === 'Ready'),
            },
            { name: 'Age', value: age(composition.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      {conditions.length > 0 && (
        <SectionBox title="Conditions">
          <ConditionsTable conditions={conditions} />
        </SectionBox>
      )}

      <EventsTable resourceName={name} resourceKind="Composition" />

      {mode === 'Pipeline' ? (
        <SectionBox title={`Pipeline Steps (${pipeline.length})`}>
          {pipeline.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No pipeline steps defined
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 2, gap: 0 }}>
              {pipeline.map((step: any, i: number) => (
                <Box key={step.step ?? i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: '4px solid',
                      borderLeftColor: 'primary.main',
                      minWidth: 280,
                    }}
                  >
                    <Typography variant="subtitle2" fontFamily="monospace" gutterBottom>
                      {step.step}
                    </Typography>
                    {step.functionRef?.name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon icon="mdi:function" width={16} />
                        <Chip
                          size="small"
                          label={
                            <HeadlampLink
                              routeName="crossplane-function-detail"
                              params={{ name: step.functionRef.name }}
                            >
                              {step.functionRef.name}
                            </HeadlampLink>
                          }
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>
                  {i < pipeline.length - 1 && (
                    <Box sx={{ pl: 2, py: 0.5 }}>
                      <Icon icon="mdi:arrow-down" width={20} />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </SectionBox>
      ) : (
        <SectionBox title={`Resources (${resources.length})`}>
          <SimpleTable
            columns={[
              { label: 'Name', getter: (r: any) => r.name ?? '—' },
              { label: 'Kind', getter: (r: any) => r.base?.kind ?? '—' },
              { label: 'API Version', getter: (r: any) => r.base?.apiVersion ?? '—' },
              { label: 'Patches', getter: (r: any) => String(r.patches?.length ?? 0) },
            ]}
            data={resources}
            emptyMessage="No resources defined"
          />
        </SectionBox>
      )}
    </Box>
  );
}
