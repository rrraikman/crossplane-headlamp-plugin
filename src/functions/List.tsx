import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CrossplaneFunction } from '../resources';
import { age, conditionStatus, StatusChip } from '../utils';

export function FunctionList() {
  const [functions] = CrossplaneFunction.useList();

  return (
    <SectionBox title="Functions">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: any) => (
              <HeadlampLink routeName="crossplane-function-detail" params={{ name: r.metadata.name }}>
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
        data={functions}
        emptyMessage="No functions found"
      />
    </SectionBox>
  );
}
