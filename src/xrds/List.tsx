import { Link as HeadlampLink, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CompositeResourceDefinition } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function XRDList() {
  const [xrds] = CompositeResourceDefinition.useList();

  return (
    <SectionBox title="Composite Resource Definitions">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: any) => (
              <HeadlampLink routeName="crossplane-xrd-detail" params={{ name: r.metadata.name }}>
                {r.metadata.name}
              </HeadlampLink>
            ),
          },
          { label: 'Group', getter: (r: any) => r.jsonData.spec?.group ?? '—' },
          {
            label: 'Versions',
            getter: (r: any) =>
              r.jsonData.spec?.versions?.map((v: any) => v.name).join(', ') ?? '—',
          },
          { label: 'Composite Kind', getter: (r: any) => r.jsonData.spec?.names?.kind ?? '—' },
          { label: 'Claim Kind', getter: (r: any) => r.jsonData.spec?.claimNames?.kind ?? '—' },
          {
            label: 'Established',
            getter: (r: any) => <StatusChip status={conditionStatus(r, 'Established')} />,
          },
          { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={xrds}
        emptyMessage="No composite resource definitions found"
      />
    </SectionBox>
  );
}
