# Contributing

## Development setup

```bash
npm install
npm start        # watch mode — rebuilds on file changes
```

Load the built plugin in [Headlamp](https://headlamp.dev) by pointing it at the `dist/` directory.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run tsc` | Type-check without emitting |
| `npm run lint` | Lint with ESLint |
| `npm run lint-fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run tests with Vitest |
| `npm run build` | Production build |
| `npm run package` | Create `.tar.gz` for distribution |

## Releasing

Releases are published via the [Release workflow](.github/workflows/release.yml) and follow [semantic versioning](https://semver.org).

### Triggering a release

Go to **Actions → Release → Run workflow**, choose a bump type, and click **Run workflow**.

The workflow will:
1. Lint and type-check the codebase
2. Bump `package.json` and create a `vX.Y.Z` tag
3. Build and package the plugin
4. Publish a GitHub release with the `.tar.gz` artifact and auto-generated release notes

### Choosing the bump type

| Type | When to use |
|---|---|
| `patch` | Bug fixes, documentation, dependency updates |
| `minor` | New features that are backwards-compatible |
| `major` | Breaking changes or significant redesigns |

### Manual tag push

If you need to release a specific version without going through the dispatch UI:

```bash
git tag v1.2.3
git push origin v1.2.3
```

Note: this skips the `package.json` version bump commit, so you should bump it manually beforehand if you want `main` to reflect the new version.
