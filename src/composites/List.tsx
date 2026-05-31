import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useEffect, useMemo, useState } from 'react';
import { CompositeResourceDefinition } from '../resources';
import { age, getReferenceableVersion, rawConditionStatus, StatusChip } from '../utils';
import { sortByReady,XRRow } from './List.utils';

export function CompositeResourceList() {
  const [xrds] = CompositeResourceDefinition.useList();
  const [xrs, setXrs] = useState<XRRow[] | null>(null);

  const xrdsKey = useMemo(
    () => xrds?.map(x => x.metadata.name).sort().join(',') ?? '',
    [xrds]
  );

  useEffect(() => {
    if (!xrds) return;
    if (xrds.length === 0) {
      setXrs([]);
      return;
    }

    Promise.all(
      xrds.map(xrd => {
        const spec = xrd.jsonData.spec;
        const group = spec.group;
        const version = getReferenceableVersion(spec);
        const plural = spec.names.plural;
        const kind = spec.names.kind;

        return request(`/apis/${group}/${version}/${plural}`)
          .then((data: any) =>
            (data.items ?? []).map((item: any): XRRow => ({
              name: item.metadata.name,
              kind,
              group,
              version,
              plural,
              ready: rawConditionStatus(item.status?.conditions ?? [], 'Ready'),
              synced: rawConditionStatus(item.status?.conditions ?? [], 'Synced'),
              creationTimestamp: item.metadata.creationTimestamp,
            }))
          )
          .catch(() => [] as XRRow[]);
      })
    ).then(results => setXrs(sortByReady(results.flat())));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xrdsKey]);

  if (!xrds || xrs === null) return <Loader title="Loading composite resources..." />;

  return (
    <SectionBox title={`Composite Resources (${xrs.length})`}>
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: XRRow) => (
              <HeadlampLink
                routeName="crossplane-composite-detail"
                params={{ group: r.group, version: r.version, plural: r.plural, name: r.name }}
              >
                {r.name}
              </HeadlampLink>
            ),
          },
          { label: 'Kind', getter: (r: XRRow) => r.kind },
          { label: 'Ready', getter: (r: XRRow) => <StatusChip status={r.ready} /> },
          { label: 'Synced', getter: (r: XRRow) => <StatusChip status={r.synced} /> },
          { label: 'Age', getter: (r: XRRow) => age(r.creationTimestamp) },
        ]}
        data={xrs}
        emptyMessage="No composite resources found"
      />
    </SectionBox>
  );
}
