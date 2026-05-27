import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Chip, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Composition, CompositeResourceDefinition } from '../resources';
import { age, rawConditionStatus, StatusChip } from '../utils';

function getReferenceableVersion(spec: any): string {
  const versions: any[] = spec?.versions ?? [];
  return versions.find(v => v.referenceable)?.name ?? versions[0]?.name ?? 'v1';
}

function isReady(conditions: any[]): boolean {
  return conditions?.find((c: any) => c.type === 'Ready')?.status === 'True';
}


// Returns the most actionable error message: Synced failure first (pipeline error),
// then Ready failure (provisioning still in progress).
function debugMessage(conditions: any[]): string | null {
  const synced = conditions?.find((c: any) => c.type === 'Synced');
  if (synced && synced.status !== 'True' && synced.message) return synced.message;
  const ready = conditions?.find((c: any) => c.type === 'Ready');
  if (ready && ready.status !== 'True' && ready.message) return ready.message;
  return null;
}

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

// Sort failing instances to the top.
function sortByReady(items: any[]): any[] {
  return [...items].sort((a, b) => {
    const aOk = isReady(a.status?.conditions ?? []);
    const bOk = isReady(b.status?.conditions ?? []);
    return Number(aOk) - Number(bOk);
  });
}

interface NotReadyInstance {
  instanceKind: string;
  name: string;
  namespace: string;
  reason: string;
  message: string;
}

function buildNotReadyInstances(
  xrs: any[] | null,
  claims: any[] | null,
  xrKind: string,
  claimKind: string
): NotReadyInstance[] {
  const rows: NotReadyInstance[] = [];

  for (const r of xrs ?? []) {
    const conds = r.status?.conditions ?? [];
    if (!isReady(conds)) {
      const failing = conds.find((c: any) => c.status !== 'True');
      rows.push({
        instanceKind: xrKind,
        name: r.metadata.name,
        namespace: '—',
        reason: failing?.reason ?? 'Unknown',
        message: debugMessage(conds) ?? 'No message reported',
      });
    }
  }

  for (const r of claims ?? []) {
    const conds = r.status?.conditions ?? [];
    if (!isReady(conds)) {
      const failing = conds.find((c: any) => c.status !== 'True');
      rows.push({
        instanceKind: claimKind,
        name: r.metadata.name,
        namespace: r.metadata.namespace ?? '—',
        reason: failing?.reason ?? 'Unknown',
        message: debugMessage(conds) ?? 'No message reported',
      });
    }
  }

  return rows;
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
      {/* 1. Status bar */}
      <Box px={2} pt={2}>
        {established ? (
          <Alert severity="success">Established</Alert>
        ) : (
          <Alert severity="error">
            <strong>Not established</strong>
            {establishedCond && (
              <>
                {' — '}
                <strong>{establishedCond.reason}</strong>
                {establishedCond.message && `: ${establishedCond.message}`}
              </>
            )}
          </Alert>
        )}
      </Box>

      {/* 2. Metadata */}
      <SectionBox title={name}>
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

      {/* 3. Not Ready instances */}
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
    </Box>
  );
}
