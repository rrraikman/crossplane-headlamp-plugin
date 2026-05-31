import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { Composition, CrossplaneFunction, CrossplaneFunctionRevision } from '../resources';
import { age, conditionStatus } from '../utils';
import { packageStatusLabel } from './Detail.utils';

export function FunctionDetail() {
  const { name } = useParams<{ name: string }>();
  const [fn] = CrossplaneFunction.useGet(name);
  const [compositions] = Composition.useList();

  const revisionName = fn?.jsonData?.status?.currentRevision ?? '';
  const [revision] = CrossplaneFunctionRevision.useGet(revisionName);

  const referencingCompositions = useMemo(
    () => (compositions ?? []).filter(c =>
      (c.jsonData.spec?.pipeline ?? []).some((step: any) => step.functionRef?.name === name)
    ),
    [compositions, name]
  );

  if (!fn) return <Loader title="Loading..." />;

  const conditions: any[] = fn.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(fn, 'Installed');
  const healthy = conditionStatus(fn, 'Healthy');

  const overallOk = installed === 'True' && healthy === 'True';

  return (
    <Box pb={6}>
      <BackLink />
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small"
          label={packageStatusLabel(installed, healthy)}
          color={overallOk ? 'success' : 'error'}
        />,
      ] }}>
        <NameValueTable
          rows={[
            { name: 'Package', value: fn.jsonData.spec?.package ?? '—' },
            { name: 'Current Revision', value: fn.jsonData.status?.currentRevision ?? '—' },
            { name: 'Age', value: age(fn.metadata.creationTimestamp) },
          ]}
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable conditions={conditions} />
      </SectionBox>

      {revision && (
        <SectionBox title={`Function Revision: ${revisionName}`}>
          <NameValueTable
            rows={[
              { name: 'Package', value: revision.jsonData.spec?.package ?? '—' },
              { name: 'Revision', value: String(revision.jsonData.spec?.revision ?? '—') },
              { name: 'Desired State', value: revision.jsonData.spec?.desiredState ?? '—' },
            ]}
          />
          <Box mt={2}>
            <ConditionsTable conditions={revision.jsonData.status?.conditions ?? []} />
          </Box>
        </SectionBox>
      )}

      <SectionBox title={`Used by Compositions (${referencingCompositions.length})`}>
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (c: any) => (
                <HeadlampLink routeName="crossplane-composition-detail" params={{ name: c.metadata.name }}>
                  {c.metadata.name}
                </HeadlampLink>
              ),
            },
            { label: 'Composite Type', getter: (c: any) => c.jsonData.spec?.compositeTypeRef?.kind ?? '—' },
            { label: 'Age', getter: (c: any) => age(c.metadata.creationTimestamp) },
          ]}
          data={referencingCompositions}
          emptyMessage="No compositions reference this function"
        />
      </SectionBox>
    </Box>
  );
}
