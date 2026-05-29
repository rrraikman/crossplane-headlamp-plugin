import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ClaimDetail } from './claims/Detail';
import { ClaimList } from './claims/List';
import { CompositeDetail } from './composites/Detail';
import { CompositeResourceList } from './composites/List';
import { CompositionDetail } from './compositions/Detail';
import { CompositionList } from './compositions/List';
import { FunctionDetail } from './functions/Detail';
import { FunctionList } from './functions/List';
import { ManagedResourceDetail } from './managed/Detail';
import { ManagedResourceBrowser } from './managed/List';
import { ManagedResourceTypeList } from './managed/TypeList';
import { CrossplaneOverview } from './overview';
import { ConfigurationDetail } from './packages/ConfigurationDetail';
import { PackageList } from './packages/List';
import { ProviderDetail } from './packages/ProviderDetail';
import { XRDDetail } from './xrds/Detail';
import { XRDList } from './xrds/List';

// ── Sidebar ──────────────────────────────────────────────────────────────────

registerSidebarEntry({
  parent: null,
  name: 'crossplane',
  label: 'Crossplane',
  icon: 'mdi:puzzle-outline',
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
  name: 'crossplane-claims',
  label: 'Claims',
  url: '/crossplane/claims',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-composites',
  label: 'Composite Resources',
  url: '/crossplane/composites',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-managed-resources',
  label: 'Managed Resources',
  url: '/crossplane/managed-resources',
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

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-functions',
  label: 'Functions',
  url: '/crossplane/functions',
});

registerSidebarEntry({
  parent: 'crossplane',
  name: 'crossplane-packages',
  label: 'Packages',
  url: '/crossplane/packages',
});

// ── Routes ───────────────────────────────────────────────────────────────────

registerRoute({
  path: '/crossplane/overview',
  sidebar: 'crossplane-overview',
  component: () => <CrossplaneOverview />,
  exact: true,
  name: 'crossplane-overview',
});

registerRoute({
  path: '/crossplane/claims',
  sidebar: 'crossplane-claims',
  component: () => <ClaimList />,
  exact: true,
  name: 'crossplane-claims',
});

registerRoute({
  path: '/crossplane/claim/:group/:version/:plural/:namespace/:name',
  sidebar: 'crossplane-claims',
  component: () => <ClaimDetail />,
  name: 'crossplane-claim-detail',
});

registerRoute({
  path: '/crossplane/composites',
  sidebar: 'crossplane-composites',
  component: () => <CompositeResourceList />,
  exact: true,
  name: 'crossplane-composites',
});

registerRoute({
  path: '/crossplane/composite/:group/:version/:plural/:name',
  sidebar: 'crossplane-composites',
  component: () => <CompositeDetail />,
  name: 'crossplane-composite-detail',
});

registerRoute({
  path: '/crossplane/managed-resources',
  sidebar: 'crossplane-managed-resources',
  component: () => <ManagedResourceBrowser />,
  exact: true,
  name: 'crossplane-managed-resources',
});

registerRoute({
  path: '/crossplane/managed-resources/:group/:version/:plural/:kind',
  sidebar: 'crossplane-managed-resources',
  component: () => <ManagedResourceTypeList />,
  name: 'crossplane-managed-type',
});

registerRoute({
  path: '/crossplane/managed/:group/:version/:plural/:name',
  sidebar: 'crossplane-managed-resources',
  component: () => <ManagedResourceDetail />,
  name: 'crossplane-managed-detail',
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
  path: '/crossplane/functions',
  sidebar: 'crossplane-functions',
  component: () => <FunctionList />,
  exact: true,
  name: 'crossplane-functions',
});

registerRoute({
  path: '/crossplane/functions/:name',
  sidebar: 'crossplane-functions',
  component: () => <FunctionDetail />,
  name: 'crossplane-function-detail',
});

registerRoute({
  path: '/crossplane/packages',
  sidebar: 'crossplane-packages',
  component: () => <PackageList />,
  exact: true,
  name: 'crossplane-packages',
});

registerRoute({
  path: '/crossplane/providers/:name',
  sidebar: 'crossplane-packages',
  component: () => <ProviderDetail />,
  name: 'crossplane-provider-detail',
});

registerRoute({
  path: '/crossplane/configurations/:name',
  sidebar: 'crossplane-packages',
  component: () => <ConfigurationDetail />,
  name: 'crossplane-configuration-detail',
});
