> **Note:** This is a vibe-coded side project. It works, but expect rough edges and no guarantees of stability or support.

# Crossplane Inspector — Headlamp Plugin

A [Headlamp](https://headlamp.dev) plugin for inspecting and debugging [Crossplane](https://crossplane.io) resources. It gives you a dedicated UI section in Headlamp where you can drill down from a high-level overview all the way to individual managed resources and their error conditions — without `kubectl`.

## Features

- **Overview page** — health stat cards for Claims, Compositions, XRDs, Configurations, and Providers, plus a "Not Ready" panel that surfaces failing resources immediately
- **Claims** — list and detail views linked to their backing Composite Resource and managed resources
- **Composite Resources (XRs)** — list and detail views with conditions, events, and managed resource tree
- **Managed Resources** — browseable by type, detail view with conditions, events, and full spec
- **XRDs** — list and detail views showing XR instances, claim types, and associated compositions
- **Compositions** — list and detail views showing pipeline steps (v2) or resource templates (v1)
- **Packages** — Providers and Configurations with current revision info and conditions
- Live updates via Kubernetes watch streams
- Three-state status chips (green / yellow / red) throughout

## Installation

### Prerequisites

- [Headlamp](https://headlamp.dev) desktop app or server
- A Kubernetes cluster with [Crossplane](https://crossplane.io) installed

### From a release (recommended)

1. Download the latest `.tar.gz` from the [Releases](../../releases) page
2. Extract it into your Headlamp plugins directory:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Headlamp/plugins/` |
| Linux | `~/.config/Headlamp/plugins/` |
| Windows | `%APPDATA%\Headlamp\plugins\` |

```bash
tar -xzf crossplane-headlamp-plugin-*.tar.gz -C <plugins-dir>
```

3. Restart Headlamp — a **Crossplane** section will appear in the sidebar.

### Building from source

```bash
git clone https://github.com/rrraikman/crossplane-headlamp-plugin
cd crossplane-headlamp-plugin
npm install
npm run build
npm run package   # produces crossplane-headlamp-plugin-*.tar.gz
```

Then extract the `.tar.gz` into your plugins directory as above.

### Development mode

```bash
npm install
npm start   # watches for changes and rebuilds automatically
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow.

## Project structure

```
src/
  overview.tsx         # Overview page with stat cards and not-ready panel
  claims/              # Claim list and detail
  composites/          # Composite Resource (XR) list and detail
  managed/             # Managed Resource browser, type list, and detail
  xrds/                # XRD list and detail
  compositions/        # Composition list and detail
  functions/           # Function list and detail
  packages/            # Provider and Configuration list and detail
  components/          # Shared components (ConditionsTable, EventsTable, InfoDialog)
  resources.ts         # KubeObject subclasses for Crossplane CRDs
  utils.tsx            # Shared helpers (age, StatusChip, conditionStatus)
```

## License

MIT
