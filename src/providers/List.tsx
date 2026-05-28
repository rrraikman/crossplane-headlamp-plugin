import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Provider } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function ProviderList() {
  const [providers] = Provider.useList();

  return (
    <SectionBox title="Providers">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: any) => (
              <HeadlampLink routeName="crossplane-provider-detail" params={{ name: r.metadata.name }}>
                {r.metadata.name}
              </HeadlampLink>
            ),
          },
          { label: 'Package', getter: (r: any) => r.jsonData.spec?.package ?? '—' },
          {
            label: 'Installed',
            getter: (r: any) => <StatusChip status={conditionStatus(r, 'Installed')} />,
          },
          {
            label: 'Healthy',
            getter: (r: any) => <StatusChip status={conditionStatus(r, 'Healthy')} />,
          },
          { label: 'Age', getter: (r: any) => age(r.metadata.creationTimestamp) },
        ]}
        data={providers}
        emptyMessage="No providers found"
      />
    </SectionBox>
  );
}
