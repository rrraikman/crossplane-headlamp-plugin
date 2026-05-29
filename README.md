> **Note:** This is a vibe-coded side project. It works, but expect rough edges and no guarantees of stability or support.

# Crossplane Inspector — Headlamp Plugin

A [Headlamp](https://headlamp.dev) plugin for inspecting and debugging [Crossplane](https://crossplane.io) resources. Gives you a dedicated UI section where you can drill down from a high-level overview all the way to individual managed resources and their error conditions — without `kubectl`.

## Features

- **Overview** — health stat cards for Claims, Compositions, XRDs, Configurations, and Providers, plus a "Not Ready" panel that surfaces failing resources immediately
- **Claims** — list and detail views linked to their backing Composite Resource and managed resources
- **Composite Resources (XRs)** — list and detail views with conditions, events, and managed resource tree
- **Managed Resources** — browseable by type, with conditions, events, and full spec
- **XRDs** — list and detail views showing XR instances, claim types, and associated compositions
- **Compositions** — list and detail views showing pipeline steps (v2) or resource templates (v1)
- **Functions** — list and detail views
- **Packages** — Providers and Configurations with current revision info and conditions
- Live updates via Kubernetes watch streams
- Three-state status chips (green / yellow / red) throughout

## Installation

**Prerequisites:** [Headlamp](https://headlamp.dev) desktop app or server, and a Kubernetes cluster with [Crossplane](https://crossplane.io) installed.

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/rrraikman/crossplane-headlamp-plugin/main/install.sh | bash
```

Restart Headlamp — a **Crossplane** section will appear in the sidebar.

### Windows / manual

1. Download the latest `.tar.gz` from the [Releases](../../releases) page
2. Extract it into your Headlamp plugins directory:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Headlamp/plugins/` |
| Linux | `~/.config/Headlamp/plugins/` |
| Windows | `%APPDATA%\Headlamp\plugins\` |

3. Restart Headlamp.

### Building from source

```bash
git clone https://github.com/rrraikman/crossplane-headlamp-plugin
cd crossplane-headlamp-plugin
npm install && npm run build && npm run package
```

Then install the resulting `.tar.gz` using the manual steps above.

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for the local dev setup and [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions and the release process.

## License

MIT
