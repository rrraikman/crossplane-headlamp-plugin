> **Note:** This is a vibe-coded side project. It works, but expect rough edges and no guarantees of stability or support.

# Crossplane Inspector — Headlamp Plugin

A [Headlamp](https://headlamp.dev) plugin for inspecting and debugging [Crossplane](https://crossplane.io) resources. It gives you a dedicated UI section in Headlamp where you can drill down from a high-level overview all the way to individual managed resources and their error conditions — without `kubectl`.

## Features

- **Overview page** — status tiles for Providers, Configurations, XRDs, and Compositions, plus a "Not Ready" panel that surfaces failing resources immediately
- **Composite Resource Definitions** — list and detail views showing XR instances, claims, associated compositions, and any not-ready instances with their error messages
- **Composite Resources (XRs)** — detail view with conditions, events, and managed resources
- **Claims** — detail view linked to their backing XR and managed resources
- **Managed Resources** — detail view with conditions, events, and full spec
- **Providers & Configurations** — detail views with current revision info and conditions
- **Compositions** — list and detail views showing pipeline steps (v2) or resource templates (v1)
- Live updates via Kubernetes watch streams (same as the FluxCD plugin)
- Three-state status chips (green / yellow / red) throughout

## Installation

### Prerequisites

- [Headlamp](https://headlamp.dev) desktop app or server (v0.20+)
- Access to a Kubernetes cluster with Crossplane installed

### From a release package

1. Download the latest `.tar.gz` from the [Releases](../../releases) page
2. Open Headlamp → Settings → Plugins
3. Click **Install from file** and select the downloaded archive
4. Restart Headlamp — a **Crossplane** section will appear in the sidebar

### Building from source

```bash
git clone https://github.com/aikman-ryan/crossplane-headlamp-plugin
cd crossplane-headlamp-plugin
npm install
npm run build
npm run package   # produces crossplane-headlamp-plugin.tar.gz
```

Then install the `.tar.gz` via Headlamp's plugin settings as above.

### Development mode

```bash
npm install
npm start
```

Point Headlamp at the dev server output or copy the built files to your Headlamp plugins directory. Changes are watched and rebuilt automatically.

## Project structure

```
src/
  overview/          # Overview page with tiles and not-ready panel
  xrds/              # XRD list and detail
  composite/         # Composite Resource (XR) detail
  claims/            # Claim detail
  managed/           # Managed Resource detail
  providers/         # Provider detail
  configurations/    # Configuration detail
  compositions/      # Composition list and detail
  components/        # Shared components (ConditionsTable, ManagedResources, EventsTable)
  resources.ts       # KubeObject subclasses for Crossplane CRDs
  utils.tsx          # Shared helpers (age, StatusChip, conditionStatus)
```

## License

MIT
