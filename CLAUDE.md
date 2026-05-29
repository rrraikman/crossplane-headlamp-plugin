# AGENTS.md

This file provides guidance for AI coding agents working on this Headlamp plugin.

## Available Scripts

The following npm scripts are available for development and testing:

- **`npm run format`** - Format code with prettier
- **`npm run lint`** - Lint code with eslint for coding issues
- **`npm run lint-fix`** - Automatically fix linting issues
- **`npm run build`** - Build the plugin for production
- **`npm run tsc`** - Type check code with TypeScript compiler
- **`npm run test`** - Run tests with vitest
- **`npm start`** - Start development server watching for changes
- **`npm run storybook`** - Start Storybook for component development
- **`npm run storybook-build`** - Build static Storybook
- **`npm run i18n`** - Extract translatable strings for internationalization
- **`npm run package`** - Create a tarball of the plugin package

## Plugin Development Resources

### Example Plugins

Explore these example plugins in `node_modules/@kinvolk/headlamp-plugin/examples/` to learn common patterns:

- **activity** - Shows how to add activity tracking and monitoring
- **app-menus** - Demonstrates adding custom menus to the app bar
- **change-logo** - Shows how to customize the Headlamp logo
- **cluster-chooser** - Demonstrates cluster selection UI
- **custom-theme** - Shows how to create custom themes
- **customizing-map** - Demonstrates customizing resource visualization maps
- **details-view** - Shows how to customize resource detail views
- **dynamic-clusters** - Demonstrates dynamic cluster configuration
- **headlamp-events** - Shows how to work with Kubernetes events
- **pod-counter** - Simple example counting pods and displaying in app bar
- **projects** - Demonstrates project/namespace organization
- **resource-charts** - Shows how to add custom charts for resources
- **sidebar** - Demonstrates customizing the sidebar navigation
- **tables** - Shows how to create custom resource tables
- **ui-panels** - Demonstrates adding custom UI panels

### Official Plugins

Check out production-ready plugins in `node_modules/@kinvolk/headlamp-plugin/official-plugins/` for advanced patterns:

#### Using Custom Resource Definitions (CRDs)

- **cert-manager** - Complete CRD integration for cert-manager resources
  - Files: `official-plugins/cert-manager/src/resources/` (certificate.ts, issuer.ts, clusterIssuer.ts, etc.)
  - Shows how to register and display custom resources for certificates, issuers, challenges, and orders
- **flux** - GitOps CRDs for Flux resources
  - Files: `official-plugins/flux/src/` (kustomization, helmrelease, gitrepository resources)
  - Demonstrates working with Flux CRDs for GitOps workflows
- **keda** - Kubernetes Event Driven Autoscaling CRDs
  - Files: `official-plugins/keda/src/resources/` (scaledobject.ts, scaledjob.ts, triggerauthentication.ts)
  - Shows CRD integration for event-driven autoscaling
- **karpenter** - Node provisioning CRDs
  - Files: `official-plugins/karpenter/src/` (NodeClass, EC2NodeClass resources)
  - Demonstrates multiple CRD deployment types (EKS Auto Mode, self-installed)

#### Visualizing Relationships with Maps

- **keda** - Map view showing KEDA resource relationships
  - File: `official-plugins/keda/src/mapView.tsx`
  - Uses edge creation (`makeKubeToKubeEdge`) to visualize connections between ScaledObjects, ScaledJobs, and TriggerAuthentications
  - Shows how to build graph visualizations of resource dependencies

#### Adding Metrics and Charts

- **prometheus** - Advanced charts for workload resources
  - Files: `official-plugins/prometheus/src/components/Chart/`
  - Provides CPU, memory, network, and disk charts using Prometheus metrics
  - Includes specialized charts for Karpenter (KarpenterChart, KarpenterNodeClaimCreationChart)
  - Shows KEDA metrics (KedaActiveJobsChart, KedaScalerMetricsChart, KedaHPAReplicasChart)
  - File: `official-plugins/prometheus/src/request.tsx` for fetching Prometheus data
- **opencost** - Cost metrics and visualization
  - File: `official-plugins/opencost/src/detail.tsx`
  - Uses `recharts` library (AreaChart, CartesianGrid, Tooltip) to display cost data
  - Shows how to fetch and display custom metrics from external services
  - Demonstrates time-series data visualization with stacked area charts

#### Other Advanced Patterns

- **ai-assistant** - AI integration for cluster management
- **app-catalog** - Helm chart catalog powered by ArtifactHub
- **backstage** - Integration with Backstage developer portal

### Key Topics and Examples

#### Adding Items to the App Bar

- **Example:** `pod-counter` - Shows `registerAppBarAction` to add items to top bar
- **File:** `examples/pod-counter/src/index.tsx`

#### Customizing the Sidebar

- **Example:** `sidebar` - Demonstrates `registerSidebarEntry` and `registerSidebarEntryFilter`
- **File:** `examples/sidebar/src/index.tsx`

#### Working with Resource Details

- **Example:** `details-view` - Shows how to customize resource detail pages
- **File:** `examples/details-view/src/index.tsx`

#### Creating Custom Tables

- **Example:** `tables` - Demonstrates custom table implementations
- **File:** `examples/tables/src/index.tsx`

#### Adding Charts and Visualizations

- **Example:** `resource-charts` - Shows how to add custom charts
- **File:** `examples/resource-charts/src/index.tsx`

#### Theme Customization

- **Example:** `custom-theme` - Demonstrates theme customization
- **File:** `examples/custom-theme/src/index.tsx`

#### Internationalization (i18n)

- Use `npm run i18n <locale>` to add new locales (e.g., `npm run i18n es` for Spanish)
- Translation files are in `locales/<locale>/translation.json`
- Use `useTranslation()` hook from `@kinvolk/headlamp-plugin/i18n`

## Development Workflow

1. **Start Development:** Run `npm start` to watch for changes
2. **Make Changes:** Edit files in `src/`
3. **Type Check:** Run `npm run tsc` to check for TypeScript errors
4. **Lint:** Run `npm run lint` to check for code quality issues
5. **Format:** Run `npm run format` to format code
6. **Test:** Run `npm run test` to run tests
7. **Build:** Run `npm run build` to create production build

## Commit Messages — Conventional Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org). Every commit must follow:

```
<type>(<optional scope>): <description>
```

Common types and their effect on versioning:

| Type | Meaning | Version bump |
|---|---|---|
| `feat` | New user-facing feature | minor |
| `fix` | Bug fix | patch |
| `refactor` | Code restructure, no behaviour change | none |
| `chore` | Deps, tooling, config | none |
| `docs` | Documentation only | none |
| `ci` | CI/CD changes | none |

Append `!` (e.g. `feat!:`) or add `BREAKING CHANGE:` in the footer for a **major** bump.

Releases are automated via Release Please: it opens a PR on every push to `main`, bumps `package.json`, and maintains `CHANGELOG.md`. Merging the release PR triggers the build and publish workflow.

## Best Practices

- Follow the patterns shown in the example plugins
- Use TypeScript for type safety
- Keep plugins focused on a single feature or enhancement
- Document your plugin's functionality in the README.md

## API Documentation

For detailed API documentation, visit:

- [Headlamp Plugin API Reference](https://headlamp.dev/docs/latest/development/api/)
- [Plugin Development Guide](https://headlamp.dev/docs/latest/development/plugins/)
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook)

## This Plugin: Crossplane Inspector

### Routing — Always Use HeadlampLink

Headlamp prefixes all routes with `/c/:cluster/`. Never use react-router-dom `<Link to="/crossplane/...">` — it produces bare paths that 404. Always use Headlamp's `Link` component with `routeName`:

```tsx
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';

<HeadlampLink routeName="crossplane-xrd-detail" params={{ name: r.metadata.name }}>
  {r.metadata.name}
</HeadlampLink>
```

### Fetching Dynamic CRD Resources

Crossplane XRs and Claims live under user-defined API groups. You cannot `GET /apis/{group}/{version}/{plural}/{name}` directly — some clusters return 404 for individual resource GETs even when the list works. The reliable pattern is to fetch the list and filter:

```ts
const list = await request(`/apis/${group}/${version}/${plural}`);
const item = (list.items ?? []).find((r: any) => r.metadata.name === name);
```

To resolve plural names dynamically (e.g., from an apiVersion + kind pair), call the discovery endpoint:

```ts
const discovery = await request(`/apis/${group}/${version}`);
const resource = discovery.resources.find((r: any) => r.kind === kind && !r.name.includes('/'));
const plural = resource?.name ?? kind.toLowerCase() + 's';
```

Use a module-level `Map` to cache these lookups and avoid redundant API calls (see `src/managed/ManagedResources.tsx`).

### Crossplane API Groups

- `pkg.crossplane.io/v1` — Provider, Configuration, ProviderRevision, ConfigurationRevision
- `pkg.crossplane.io/v1beta1` — Function, FunctionRevision
- `apiextensions.crossplane.io/v1` — CompositeResourceDefinition, Composition
- XRs and Claims: user-defined group, discovered via XRD `spec.group` + `spec.names.plural`

### Status Chips in Section Headers

To place a status chip inline with a section title (without shrinking the heading font), use `SectionBox`'s `headerProps.titleSideActions`. Wrapping the title in a `<Box>` instead causes `SectionBox` to treat it as a ReactNode and skip the heading typography.

```tsx
<SectionBox title={name} headerProps={{ titleSideActions: [
  <Chip size="small" label={overallOk ? 'Ready' : 'Not Ready'} color={overallOk ? 'success' : 'error'} />,
] }}>
```

### Pitfalls

**Do not name KubeObject subclasses after JS built-ins.** `export class Function extends KubeObject` shadows the global `Function` constructor and crashes the entire plugin module at load time with no useful error message. Use a prefixed name like `CrossplaneFunction` instead.

**Do not import from `@mui/icons-material`.** It pulls in `createSvgIcon` via `@mui/material/utils`, which is not in Headlamp's Vite externals list. The import resolves to `undefined` at runtime and crashes the plugin. Use `@iconify/react` for all icons:

```tsx
import { Icon } from '@iconify/react';
<Icon icon="mdi:information-outline" width={20} />
```

### Discovering Managed Resource Types

Two approaches, used together as a fallback chain (see `src/managed/List.tsx`):

1. **Label selector** — fast, server-side: `GET /apis/apiextensions.k8s.io/v1/customresourcedefinitions?labelSelector=crossplane.io%2Fresource%3Dmanaged`
2. **Category filter** — fallback for older providers that don't set the label: fetch all CRDs and filter where `spec.names.categories` includes `'managed'`

### Condition Helpers

Two helpers exist for checking conditions depending on the data shape:

- `conditionStatus(resource, type)` — for KubeObject instances (accesses `.jsonData.status.conditions`)
- `rawConditionStatus(conditions, type)` — for raw API response JSON (accesses `.status.conditions` directly)

Both return `'True'`, `'False'`, or `'Unknown'`. The `StatusChip` component renders green/red/yellow accordingly.

### Crossplane v2 Spec Layout

Some clusters run Crossplane v2, which nests internal fields under `spec.crossplane` instead of directly on `spec`. Always use the fallback pattern when reading these fields:

```ts
xr.spec?.crossplane?.resourceRefs ?? xr.spec?.resourceRefs
xr.spec?.crossplane?.resourceRef  ?? xr.spec?.resourceRef
xr.spec?.crossplane?.compositionRef ?? xr.spec?.compositionRef
xr.spec?.crossplane?.claimRef ?? xr.spec?.claimRef
```

Without the fallback, these fields will silently return `undefined` on v2 clusters.

### Live Updates via Dynamic KubeObject Classes

For detail pages on user-defined CRDs (XRs, Claims, MRs), create a dynamic KubeObject subclass in `useMemo` and use `useList()` to get the same WebSocket watch stream that Flux and other Headlamp plugins use:

```tsx
const XRClass = useMemo(() => {
  class DynamicXR extends KubeObject {
    static kind = plural;
    static apiName = plural;
    static apiVersion = `${group}/${version}`;
    static isNamespaced = false;
  }
  return DynamicXR;
}, [group, version, plural]);

const [xrs, error] = XRClass.useList();
const xr = useMemo(
  () => xrs?.find(r => r.metadata.name === name)?.jsonData ?? null,
  [xrs, name]
);
```

This avoids both the GET-by-name 404 issue and the need for polling — the SDK handles the watch stream automatically.

### List Responses May Omit Spec

Kubernetes sometimes strips `spec` fields from list responses to reduce payload size. If a detail page needs the full spec (e.g., the MR detail Spec section), try GET-by-name first and fall back to list-and-find:

```ts
request(`/apis/${group}/${version}/${plural}/${name}`)
  .catch(() =>
    request(`/apis/${group}/${version}/${plural}`).then((data: any) => {
      const found = (data.items ?? []).find((r: any) => r.metadata.name === name);
      if (!found) throw new Error('not found');
      return found;
    })
  )
```

Use `useList()` (via dynamic KubeObject) for live status/conditions, and this GET pattern separately for the spec.
