import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ClaimDetail } from './claims/Detail';
import { ConfigurationDetail } from './configurations/Detail';
import { CompositeDetail } from './composite/Detail';
import { CompositionDetail } from './compositions/Detail';
import { CompositionList } from './compositions/List';
import { ManagedResourceDetail } from './managed/Detail';
import { CrossplaneOverview } from './overview';
import { ProviderDetail } from './providers/Detail';
import { XRDDetail } from './xrds/Detail';
import { XRDList } from './xrds/List';

registerSidebarEntry({
  parent: null,
  name: 'crossplane',
  label: 'Crossplane',
  icon: 'mdi:crosshairs',
  url: '/crossplane/overview',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-overview',
  label: 'Overview',
  url: '/crossplane/overview',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-xrds',
  label: 'Composite Resource Definitions',
  url: '/crossplane/xrds',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-compositions',
  label: 'Compositions',
  url: '/crossplane/compositions',
});

registerRoute({
  path: '/crossplane/overview',
  sidebar: 'crossplane-overview',
  component: () => <CrossplaneOverview />,
  exact: true,
  name: 'crossplane-overview',
});

registerRoute({
  path: '/crossplane/xrds',
  sidebar: 'crossplane-xrds',
  component: () => <XRDList />,
  exact: true,
  name: 'crossplane-xrds',
});

registerRoute({
  path: '/crossplane/xrds/:name',
  sidebar: 'crossplane-xrds',
  component: () => <XRDDetail />,
  name: 'crossplane-xrd-detail',
});

registerRoute({
  path: '/crossplane/providers/:name',
  sidebar: 'crossplane-overview',
  component: () => <ProviderDetail />,
  name: 'crossplane-provider-detail',
});

registerRoute({
  path: '/crossplane/configurations/:name',
  sidebar: 'crossplane-overview',
  component: () => <ConfigurationDetail />,
  name: 'crossplane-configuration-detail',
});

registerRoute({
  path: '/crossplane/compositions',
  sidebar: 'crossplane-compositions',
  component: () => <CompositionList />,
  exact: true,
  name: 'crossplane-compositions',
});

registerRoute({
  path: '/crossplane/compositions/:name',
  sidebar: 'crossplane-compositions',
  component: () => <CompositionDetail />,
  name: 'crossplane-composition-detail',
});

registerRoute({
  path: '/crossplane/composite/:group/:version/:plural/:name',
  sidebar: 'crossplane-xrds',
  component: () => <CompositeDetail />,
  name: 'crossplane-composite-detail',
});

registerRoute({
  path: '/crossplane/claim/:group/:version/:plural/:namespace/:name',
  sidebar: 'crossplane-xrds',
  component: () => <ClaimDetail />,
  name: 'crossplane-claim-detail',
});

registerRoute({
  path: '/crossplane/managed/:group/:version/:plural/:name',
  sidebar: 'crossplane-xrds',
  component: () => <ManagedResourceDetail />,
  name: 'crossplane-managed-detail',
});
