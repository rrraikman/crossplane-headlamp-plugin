import {
  BackLink,
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ConditionsTable } from '../components/ConditionsTable';
import { EventsTable } from '../components/EventsTable';
import { LoadError } from '../components/LoadError';
import { PackageRevisionSection } from '../components/PackageRevisionSection';
import { facetColumn } from '../components/tableColumns';
import { packageStatusLabel } from '../packages/Detail.utils';
import { Composition, CrossplaneFunction, CrossplaneFunctionRevision } from '../resources';
import { age, conditionStatus } from '../utils';

export function FunctionDetail() {
  const { name } = useParams<{ name: string }>();
  const [fn, fnError] = CrossplaneFunction.useGet(name);
  const [compositions] = Composition.useList();

  const revisionName: string = fn?.jsonData?.status?.currentRevision ?? '';

  const referencingCompositions = useMemo(
    () => (compositions ?? []).filter(c =>
      (c.jsonData.spec?.pipeline ?? []).some((step: any) => step.functionRef?.name === name)
    ),
    [compositions, name]
  );

  if (fnError) return <LoadError what={name} error={fnError} />;
  if (!fn) return <Loader title="Loading..." />;

  const conditions: any[] = fn.jsonData?.status?.conditions ?? [];
  const installed = conditionStatus(fn, 'Installed');
  const healthy = conditionStatus(fn, 'Healthy');

  const overallOk = installed === 'True' && healthy === 'True';

  return (
    <Box pb={6}>
      <BackLink />
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip key="status" size="small"
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

      {revisionName && (
        <PackageRevisionSection
          revisionClass={CrossplaneFunctionRevision}
          name={revisionName}
          label="Function Revision"
        />
      )}

      <SectionBox title={`Used by Compositions (${referencingCompositions.length})`}>
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (c: any) => c.metadata.name,
              Cell: ({ row }: any) => (
                <HeadlampLink routeName="crossplane-composition-detail" params={{ name: row.original.metadata.name }}>
                  {row.original.metadata.name}
                </HeadlampLink>
              ),
            },
            facetColumn('Composite Type', (c: any) => c.jsonData.spec?.compositeTypeRef?.kind),
            { header: 'Age', accessorFn: (c: any) => age(c.metadata.creationTimestamp) },
          ]}
          data={referencingCompositions}
          enableFacetedValues
          emptyMessage="No compositions reference this function"
        />
      </SectionBox>

      <EventsTable resourceName={name} resourceKind={fn.jsonData?.kind ?? 'Function'} />
    </Box>
  );
}
