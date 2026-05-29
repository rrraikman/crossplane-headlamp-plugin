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

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org). Every commit to `main` must follow the format:

```
<type>(<optional scope>): <description>
```

### Types

| Type | Use for | Version bump |
|---|---|---|
| `feat` | New user-facing feature | minor |
| `fix` | Bug fix | patch |
| `refactor` | Code restructure with no behaviour change | none |
| `chore` | Deps, tooling, config | none |
| `docs` | Documentation only | none |
| `ci` | CI/CD workflow changes | none |
| `test` | Adding or updating tests | none |

Append `!` after the type (e.g. `feat!:`) or add `BREAKING CHANGE:` in the commit footer to trigger a **major** version bump.

### Examples

```
feat(overview): add claims health stat card
fix(composites): handle missing status conditions gracefully
refactor: restructure src/ layout into feature folders
chore: update headlamp-plugin to 0.15.0
docs: add release process to CONTRIBUTING
ci: switch to Release Please for automated versioning
```

## Releasing

Releases are fully automated via [Release Please](https://github.com/googleapis/release-please) and the [release-please workflow](.github/workflows/release-please.yml).

### How it works

1. Merge conventional commits to `main`
2. Release Please opens (or updates) a **release PR** that bumps `package.json`, updates `CHANGELOG.md`, and shows what will be in the release
3. When you're ready to ship, **merge the release PR**
4. The workflow builds and packages the plugin, then publishes a GitHub release with the `.tar.gz` artifact attached

The version bump is determined automatically from the commit types:
- Any `feat:` commit since the last release → minor bump
- Only `fix:`/`chore:`/etc. → patch bump
- Any `feat!:` or `BREAKING CHANGE:` → major bump
