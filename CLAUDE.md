# AGENTS.md

This file provides guidance for AI coding agents working on this Headlamp plugin.

## Git Workflow

**Never push directly to `main`.** All changes must go through a pull request:

1. Create a new branch from `main` with a descriptive name (e.g. `feat/my-feature`, `fix/bug-name`, `chore/update-deps`)
2. Make commits on the branch
3. Open a PR targeting `main`

Branch protection and required CI checks are enforced on `main`.

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

## Pre-PR Checklist

Before opening any pull request, run the following and fix all failures:

```sh
npm run lint-fix   # auto-fix import order and style issues
npm run tsc        # must produce zero errors
npm run test -- --coverage   # all tests pass AND coverage thresholds are met
```

Coverage thresholds (defined in `vitest.config.ts`) are enforced by CI:

| Metric | Threshold |
|---|---|
| Statements | 75% |
| Branches | 67% |
| Functions | 72% |
| Lines | 74% |

**Every new feature must ship with tests that keep all four metrics above their thresholds.** If adding code causes a threshold to drop below its limit, add tests before opening the PR — do not open the PR and fix coverage after the fact.

### How to add coverage for new code

- **Pure logic / async utility functions** (`*.utils.ts`, `Detail.utils.ts`, etc.): test directly with Vitest. Mock `@kinvolk/headlamp-plugin/lib/ApiProxy`'s `request` with `vi.fn()` and set return values per test.
- **React components that don't use `KubeObject`**: render with `@testing-library/react`. Mock `@kinvolk/headlamp-plugin/lib/CommonComponents` and `react-router-dom`. Use `waitFor` for anything triggered by async `useEffect`.
- **New branches inside existing components** (e.g. a new conditional banner): add a test case to the existing `*.test.tsx` that sets up the mock state that triggers the branch, then asserts the new UI element appears (or doesn't).
- **Components that import `../resources`**: mock the entire `../resources` module and the `KubeObject` mock from `src/__mocks__/headlamp-k8s-cluster.ts`. Mock any new utility functions (`vi.mock('./Detail.utils', () => ({ myFn: vi.fn() }))`) so async effects resolve synchronously in tests.

If new code is in a file with low baseline coverage, adding even 2–3 targeted tests for the new branches is usually enough to stay above thresholds.

## Unit Testing

Tests use **Vitest** in a jsdom environment, wired up via the headlamp-plugin config. Run them with `npm test`.

### Where to put tests

Place test files **inline next to the source file** they cover (e.g. `utils.test.ts` alongside `utils.tsx`). This is the convention used by the official Headlamp plugins.

### What to test

Only pure logic functions are practical to unit test. React components and files that import `@kinvolk/headlamp-plugin/lib/k8s/cluster` (i.e. anything using `KubeObject` subclasses) cannot be imported in tests because that path has no resolvable JS file at runtime — Vite's transform stage rejects it before any `vi.mock` can intercept it.

**Practical rule:** if a file's only imports are from `./utils`, `@mui/material`, or other packages that are physically present in `node_modules`, it can be tested directly. If it imports from `./resources` or any other file that transitively pulls in `@kinvolk/headlamp-plugin/lib/k8s/cluster`, extract the pure logic into a separate file with no such dependency before writing tests.

**Example:** `overview.tsx` had untestable dependencies, so its pure logic functions (`countReady`, `resolveDetailRoute`, `collectNotReady`) were extracted into `overview.utils.ts` which has no `KubeObject` dependency and can be tested directly.

### Test file conventions

- Use `describe` blocks per function, `test` for each case
- Name tests in plain English describing the expected behaviour
- Keep fixture helpers (`makeResource`, etc.) at the top of the file, local to the test file
- `globals: true` is set — `describe`, `test`, `expect`, `vi` are available without imports, though importing them explicitly is fine too

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

### Empty State Design

**Always show sections with an empty-state message rather than hiding them when data is absent.** Users should be able to see that a section exists and understand there is simply nothing to show yet, rather than wondering whether the feature is missing.

```tsx
// Wrong — section disappears when empty:
{conditions.length > 0 && (
  <SectionBox title="Conditions">
    <ConditionsTable conditions={conditions} />
  </SectionBox>
)}

// Correct — section always visible with empty message:
<SectionBox title="Conditions">
  <ConditionsTable conditions={conditions} />
</SectionBox>
// (ConditionsTable already renders "No conditions reported" when the array is empty)
```

**Exception:** Sections that represent an error or warning state (e.g. "Not Ready instances") should remain hidden when there is nothing to report. Showing an empty error panel implies something might be wrong when everything is actually fine.

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

### Conditions That May Be Legitimately Absent (Crossplane v1)

Crossplane v1 does **not** set a `Ready` condition on Compositions — the condition is simply absent, not `False`. Treating an absent condition as "not ready" produces false positives. Two places must stay consistent:

- **Not Ready panel**: use `collectNotReady(..., { skipIfMissing: true })` so resources with no such condition are silently skipped.
- **Stat cards**: use `countReadyWhenReported(resources, condType)` (from `overview.utils.ts`) instead of `countReady`. It returns `undefined` — which renders as "N total" (neutral) — when the condition is never reported on any resource, rather than `0/N ready` (warning).

These two must agree: if the condition is absent on all resources, the stat card shows neutral and the Not Ready panel shows nothing. A consistency test in `overview.utils.test.ts` locks this in.

### Condition Message Fallback — Use `||` not `??`

```ts
// Wrong — passes through empty strings silently:
message: cond?.message ?? 'No message reported',

// Correct — treats empty string the same as missing:
message: cond?.message || 'No message reported',
```

Some providers set `message: ""` on conditions. `??` only catches `null`/`undefined`, so empty strings slip through and the UI shows a blank message cell.

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

For detail pages on user-defined CRDs (XRs, Claims, MRs), the `useDynamicKubeList` hook in `src/hooks.ts` encapsulates the dynamic subclass pattern:

```ts
const [items, error] = useDynamicKubeList(group, version, plural, isNamespaced);
```

This avoids both the GET-by-name 404 issue and the need for polling — the SDK handles the watch stream automatically. The hook accepts an optional `{ kind, namespace }` when the kind differs from the plural or you need namespace-scoped results.

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
