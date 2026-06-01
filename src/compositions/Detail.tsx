import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
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

      {mode === 'Pipeline' ? (
        <SectionBox title={`Pipeline Steps (${pipeline.length})`}>
          <SimpleTable
            columns={[
              { label: 'Step', getter: (s: any) => s.step },
              {
                label: 'Function',
                getter: (s: any) =>
                  s.functionRef?.name ? (
                    <HeadlampLink
                      routeName="crossplane-function-detail"
                      params={{ name: s.functionRef.name }}
                    >
                      {s.functionRef.name}
                    </HeadlampLink>
                  ) : (
                    '—'
                  ),
              },
            ]}
            data={pipeline}
            emptyMessage="No pipeline steps defined"
          />
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
