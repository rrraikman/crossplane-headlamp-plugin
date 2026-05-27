import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Composition } from '../resources';
import { age } from '../utils';

export function CompositionList() {
  const [compositions] = Composition.useList();

  return (
    <SectionBox title="Compositions">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (r: any) => (
              <HeadlampLink
                routeName="crossplane-composition-detail"
                params={{ name: r.metadata.name }}
              >
                {r.metadata.name}
              </HeadlampLink>
            ),
          },
          {
            label: 'Composite Type',
            getter: (r: any) => r.jsonData.spec?.compositeTypeRef?.kind ?? '—',
          },
          {
            label: 'Mode',
            getter: (r: any) => r.jsonData.spec?.mode ?? 'Resources',
          },
          {
            label: 'Age',
            getter: (r: any) => age(r.metadata.creationTimestamp),
          },
        ]}
        data={compositions}
        emptyMessage="No compositions found"
      />
    </SectionBox>
  );
}
