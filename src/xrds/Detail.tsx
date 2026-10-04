import {
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EventsTable } from '../components/EventsTable';
import { LoadError } from '../components/LoadError';
import { facetColumn, namespaceColumn, statusColumn } from '../components/tableColumns';
import { detailRouteParams, parseApiVersion } from '../discovery';
import { CompositeResourceDefinition, Composition } from '../resources';
import { age, debugMessage, getReferenceableVersion, rawConditionStatus } from '../utils';
import { useXRDInstanceLists } from '../xrdInstances';
import { buildNotReadyInstances, NotReadyInstance, sortByReady } from './Detail.utils';
import { SchemaTree } from './SchemaTree';

function MessageCell({ conditions }: { conditions: any[] }) {
  const msg = debugMessage(conditions);
  if (!msg) return <>—</>;
  return (
    <Tooltip title={msg} placement="top-start">
      <Typography
        variant="body2"
        noWrap
        sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
      >
        {msg}
      </Typography>
    </Tooltip>
  );
}

export function XRDDetail() {
  const { name } = useParams<{ name: string }>();
  const [xrd, xrdError] = CompositeResourceDefinition.useGet(name);
  const [compositions] = Composition.useList();

  const xrdList = useMemo(() => (xrd ? [xrd] : null), [xrd]);
  const compositeLists = useXRDInstanceLists(xrdList, 'composite');
  const claimLists = useXRDInstanceLists(xrdList, 'claim');
  const xrs: any[] | null = compositeLists.lists ? compositeLists.lists[0]?.items ?? [] : null;
  // null hides the Claims section for XRDs without a claim type.
  const claims: any[] | null = xrd?.jsonData.spec.claimNames?.plural
    ? claimLists.lists?.[0]?.items ?? null
    : null;

  if (xrdError) return <LoadError what={name} error={xrdError} />;
  if (!xrd) return <Loader title="Loading..." />;

  const spec = xrd.jsonData.spec;
  const establishedCond = xrd.jsonData.status?.conditions?.find(
    (c: any) => c.type === 'Established'
  );
  const established = establishedCond?.status === 'True';

  const relevantCompositions =
    compositions?.filter(c => {
      const ref = c.jsonData.spec?.compositeTypeRef;
      return (
        ref?.kind === spec.names.kind && parseApiVersion(ref?.apiVersion ?? '').group === spec.group
      );
    }) ?? [];

  const notReadyInstances = buildNotReadyInstances(
    xrs,
    claims,
    spec.names.kind,
    spec.claimNames?.kind ?? 'Claim'
  );

  const version = getReferenceableVersion(spec);

  const statusColumns = [
    statusColumn('Ready', (r: any) => rawConditionStatus(r.status?.conditions ?? [], 'Ready')),
    statusColumn('Synced', (r: any) => rawConditionStatus(r.status?.conditions ?? [], 'Synced')),
    {
      header: 'Message',
      accessorFn: (r: any) => debugMessage(r.status?.conditions ?? []) ?? '—',
      Cell: ({ row }: any) => <MessageCell conditions={row.original.status?.conditions ?? []} />,
    },
    { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
  ];

  const xrColumns = [
    ...(spec.scope === 'Namespaced' ? [namespaceColumn((r: any) => r.metadata.namespace)] : []),
    {
      header: 'Name',
      accessorFn: (r: any) => r.metadata.name,
      Cell: ({ row }: any) => (
        <HeadlampLink
          routeName="crossplane-composite-detail"
          params={detailRouteParams(
            `${spec.group}/${version}`,
            spec.names.plural,
            row.original.metadata.name,
            row.original.metadata.namespace
          )}
        >
          {row.original.metadata.name}
        </HeadlampLink>
      ),
    },
    ...statusColumns,
  ];

  const claimColumns = [
    namespaceColumn((r: any) => r.metadata.namespace),
    {
      header: 'Name',
      accessorFn: (r: any) => r.metadata.name,
      Cell: ({ row }: any) => (
        <HeadlampLink
          routeName="crossplane-claim-detail"
          params={{
            group: spec.group,
            version,
            plural: spec.claimNames?.plural ?? '',
            namespace: row.original.metadata.namespace,
            name: row.original.metadata.name,
          }}
        >
          {row.original.metadata.name}
        </HeadlampLink>
      ),
    },
    ...statusColumns,
  ];

  return (
    <Box pb={6}>
      {compositeLists.watchers}
      {claimLists.watchers}
      {/* 1. Metadata */}
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip key="status" size="small" label={established ? 'Established' : 'Not Established'} color={established ? 'success' : 'error'} />,
      ] }}>
        <NameValueTable
          rows={[
            { name: 'Group', value: spec.group },
            { name: 'Composite Kind', value: spec.names.kind },
            { name: 'Composite Plural', value: spec.names.plural },
            { name: 'Claim Kind', value: spec.claimNames?.kind ?? '—', hide: !spec.claimNames },
            {
              name: 'Versions',
              value: spec.versions
                ?.map((v: any) => (v.referenceable ? `${v.name} (referenceable)` : v.name))
                .join(', '),
            },
          ]}
        />
      </SectionBox>

      {/* 2. Not Ready instances */}
      {notReadyInstances.length > 0 && (
        <SectionBox title={`Not Ready (${notReadyInstances.length})`}>
          <Table
            columns={[
              facetColumn('Kind', (r: NotReadyInstance) => r.instanceKind),
              { header: 'Name', accessorFn: (r: NotReadyInstance) => r.name },
              namespaceColumn((r: NotReadyInstance) => r.namespace),
              {
                header: 'Reason',
                accessorFn: (r: NotReadyInstance) => r.reason,
                Cell: ({ row }: any) => (
                  <Chip size="small" label={row.original.reason} color="error" variant="outlined" />
                ),
              },
              {
                header: 'Message',
                accessorFn: (r: NotReadyInstance) => r.message,
                Cell: ({ row }: any) => (
                  <Tooltip title={row.original.message} placement="top-start">
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
                    >
                      {row.original.message}
                    </Typography>
                  </Tooltip>
                ),
              },
            ]}
            data={notReadyInstances}
            enableFacetedValues
          />
        </SectionBox>
      )}

      {/* 4. Composite Resources */}
      <SectionBox title={`Composite Resources (${xrs?.length ?? '…'})`}>
        <Table
          columns={xrColumns}
          data={xrs ? sortByReady(xrs) : []}
          enableFacetedValues
          loading={xrs === null}
          emptyMessage="No composite resources found"
        />
      </SectionBox>

      {/* 5. Claims */}
      {claims !== null && (
        <SectionBox title={`Claims (${claims.length})`}>
          <Table
            columns={claimColumns}
            data={sortByReady(claims)}
            enableFacetedValues
            emptyMessage="No claims found"
          />
        </SectionBox>
      )}

      {/* 6. Compositions */}
      <SectionBox title={`Compositions (${relevantCompositions.length})`}>
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (c: any) => c.metadata.name,
              Cell: ({ row }: any) => (
                <HeadlampLink
                  routeName="crossplane-composition-detail"
                  params={{ name: row.original.metadata.name }}
                >
                  {row.original.metadata.name}
                </HeadlampLink>
              ),
            },
            { header: 'Age', accessorFn: (c: any) => age(c.metadata.creationTimestamp) },
          ]}
          data={relevantCompositions}
          enableFacetedValues
          emptyMessage="No compositions reference this XRD"
        />
      </SectionBox>

      {/* 7. Schema */}
      {(() => {
        const refVersion = spec.versions?.find((v: any) => v.referenceable);
        const schema = refVersion?.schema?.openAPIV3Schema;
        if (!schema) return null;
        return (
          <SectionBox title={`Schema (${refVersion.name})`}>
            <SchemaTree schema={schema} />
          </SectionBox>
        );
      })()}

      {/* 8. Events */}
      <EventsTable resourceName={name} resourceKind="CompositeResourceDefinition" />
    </Box>
  );
}
