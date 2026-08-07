import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventsTable } from '../components/EventsTable';
import { CompositeResourceDefinition, Composition } from '../resources';
import { age, getReferenceableVersion, rawConditionStatus, StatusChip } from '../utils';
import { buildNotReadyInstances, debugMessage, NotReadyInstance, sortByReady } from './Detail.utils';
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
  const [xrd] = CompositeResourceDefinition.useGet(name);
  const [compositions] = Composition.useList();
  const [xrs, setXrs] = useState<any[] | null>(null);
  const [claims, setClaims] = useState<any[] | null>(null);
  const filterFunction = useFilterFunc<any>();

  useEffect(() => {
    if (!xrd) return;

    const group = xrd.jsonData.spec.group;
    const version = getReferenceableVersion(xrd.jsonData.spec);
    const plural = xrd.jsonData.spec.names.plural;

    request(`/apis/${group}/${version}/${plural}`)
      .then((data: any) => setXrs(data.items ?? []))
      .catch(() => setXrs([]));

    if (xrd.jsonData.spec.claimNames?.plural) {
      const claimPlural = xrd.jsonData.spec.claimNames.plural;
      request(`/apis/${group}/${version}/${claimPlural}`)
        .then((data: any) => setClaims(data.items ?? []))
        .catch(() => setClaims([]));
    } else {
      setClaims(null);
    }
  }, [xrd?.metadata.name]);

  if (!xrd) return <Loader title="Loading..." />;

  const spec = xrd.jsonData.spec;
  const establishedCond = xrd.jsonData.status?.conditions?.find(
    (c: any) => c.type === 'Established'
  );
  const established = establishedCond?.status === 'True';

  const relevantCompositions =
    compositions?.filter(c => {
      const ref = c.jsonData.spec?.compositeTypeRef;
      return ref?.kind === spec.names.kind && ref?.apiVersion?.startsWith(spec.group);
    }) ?? [];

  const notReadyInstances = buildNotReadyInstances(
    xrs,
    claims,
    spec.names.kind,
    spec.claimNames?.kind ?? 'Claim'
  );

  const version = getReferenceableVersion(spec);

  const statusColumns = [
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
      Cell: ({ row }: any) => <MessageCell conditions={row.original.status?.conditions ?? []} />,
    },
    { header: 'Age', accessorFn: (r: any) => age(r.metadata.creationTimestamp) },
  ];

  const xrColumns = [
    {
      header: 'Name',
      accessorFn: (r: any) => r.metadata.name,
      Cell: ({ row }: any) => (
        <HeadlampLink
          routeName="crossplane-composite-detail"
          params={{ group: spec.group, version, plural: spec.names.plural, name: row.original.metadata.name }}
        >
          {row.original.metadata.name}
        </HeadlampLink>
      ),
    },
    ...statusColumns,
  ];

  const claimColumns = [
    { header: 'Namespace', accessorFn: (r: any) => r.metadata.namespace },
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
      {/* 1. Metadata */}
      <SectionBox title={name} headerProps={{ titleSideActions: [
        <Chip size="small" label={established ? 'Established' : 'Not Established'} color={established ? 'success' : 'error'} />,
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
              { header: 'Kind', accessorFn: (r: NotReadyInstance) => r.instanceKind },
              { header: 'Name', accessorFn: (r: NotReadyInstance) => r.name },
              { header: 'Namespace', accessorFn: (r: NotReadyInstance) => r.namespace },
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
            filterFunction={filterFunction}
          />
        </SectionBox>
      )}

      {/* 4. Composite Resources */}
      <SectionBox title={`Composite Resources (${xrs?.length ?? '…'})`}>
        <Table
          columns={xrColumns}
          data={xrs ? sortByReady(xrs) : []}
          loading={xrs === null}
          filterFunction={filterFunction}
          emptyMessage="No composite resources found"
        />
      </SectionBox>

      {/* 5. Claims */}
      {claims !== null && (
        <SectionBox title={`Claims (${claims.length})`}>
          <Table
            columns={claimColumns}
            data={sortByReady(claims)}
            filterFunction={filterFunction}
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
          filterFunction={filterFunction}
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
