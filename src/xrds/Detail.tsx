import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
      label: 'Ready',
      getter: (r: any) => (
        <StatusChip status={rawConditionStatus(r.status?.conditions ?? [], 'Ready')} />
      ),
    },
    {
      label: 'Synced',
      getter: (r: any) => (
        <StatusChip status={rawConditionStatus(r.status?.conditions ?? [], 'Synced')} />
      ),
    },
    {
      label: 'Message',
      getter: (r: any) => <MessageCell conditions={r.status?.conditions ?? []} />,
    },
    { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
  ];

  const xrColumns = [
    {
      label: 'Name',
      getter: (r: any) => (
        <HeadlampLink
          routeName="crossplane-composite-detail"
          params={{ group: spec.group, version, plural: spec.names.plural, name: r.metadata.name }}
        >
          {r.metadata.name}
        </HeadlampLink>
      ),
    },
    ...statusColumns,
  ];

  const claimColumns = [
    { label: 'Namespace', getter: (r: any) => r.metadata.namespace },
    {
      label: 'Name',
      getter: (r: any) => (
        <HeadlampLink
          routeName="crossplane-claim-detail"
          params={{
            group: spec.group,
            version,
            plural: spec.claimNames?.plural ?? '',
            namespace: r.metadata.namespace,
            name: r.metadata.name,
          }}
        >
          {r.metadata.name}
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
          <SimpleTable
            columns={[
              { label: 'Kind', getter: (r: NotReadyInstance) => r.instanceKind },
              { label: 'Name', getter: (r: NotReadyInstance) => r.name },
              { label: 'Namespace', getter: (r: NotReadyInstance) => r.namespace },
              {
                label: 'Reason',
                getter: (r: NotReadyInstance) => (
                  <Chip size="small" label={r.reason} color="error" variant="outlined" />
                ),
              },
              {
                label: 'Message',
                getter: (r: NotReadyInstance) => (
                  <Tooltip title={r.message} placement="top-start">
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ maxWidth: 480, cursor: 'default', fontFamily: 'monospace' }}
                    >
                      {r.message}
                    </Typography>
                  </Tooltip>
                ),
              },
            ]}
            data={notReadyInstances}
          />
        </SectionBox>
      )}

      {/* 4. Composite Resources */}
      <SectionBox title={`Composite Resources (${xrs?.length ?? '…'})`}>
        <SimpleTable
          columns={xrColumns}
          data={xrs ? sortByReady(xrs) : null}
          emptyMessage="No composite resources found"
        />
      </SectionBox>

      {/* 5. Claims */}
      {claims !== null && (
        <SectionBox title={`Claims (${claims.length})`}>
          <SimpleTable
            columns={claimColumns}
            data={sortByReady(claims)}
            emptyMessage="No claims found"
          />
        </SectionBox>
      )}

      {/* 6. Compositions */}
      <SectionBox title={`Compositions (${relevantCompositions.length})`}>
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (c: any) => (
                <HeadlampLink
                  routeName="crossplane-composition-detail"
                  params={{ name: c.metadata.name }}
                >
                  {c.metadata.name}
                </HeadlampLink>
              ),
            },
            { label: 'Age', getter: (c: any) => age(c.metadata.creationTimestamp) },
          ]}
          data={relevantCompositions}
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
