# Development

## Setup

```bash
npm install
npm start        # watch mode — rebuilds on file changes
```

Point Headlamp at the `dist/` directory to load the plugin locally.

## Commands

| Command | Purpose |
|---|---|
| `npm start` | Watch mode — rebuild on file changes |
| `npm run build` | Production build |
| `npm run package` | Create `.tar.gz` for distribution |
| `npm run tsc` | Type-check without emitting |
| `npm run lint` | Lint with ESLint |
| `npm run lint-fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run tests with Vitest |
| `npm run storybook` | Start Storybook for component development |

## Project structure

```
src/
  overview.tsx         # Overview page — stat cards and not-ready panel
  claims/              # Claim list and detail
  composites/          # Composite Resource (XR) list and detail
  managed/             # Managed Resource browser, type list, and detail
  xrds/                # XRD list and detail
  compositions/        # Composition list and detail
  functions/           # Function list and detail
  packages/            # Provider and Configuration list and detail
  components/          # Shared components (ConditionsTable, EventsTable, etc.)
  resources.ts         # KubeObject subclasses for Crossplane CRDs
  utils.tsx            # Shared helpers (StatusChip, conditionStatus, age)
```

## Headlamp plugin resources

- [Plugin API reference](https://headlamp.dev/docs/latest/development/api/)
- [Plugin development guide](https://headlamp.dev/docs/latest/development/plugins/)
- Example plugins: `node_modules/@kinvolk/headlamp-plugin/examples/`
- Official plugins: `node_modules/@kinvolk/headlamp-plugin/official-plugins/`
