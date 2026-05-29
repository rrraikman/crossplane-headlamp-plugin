# Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to build and run the plugin locally.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org). Every commit to `main` must follow the format:

```
<type>(<optional scope>): <description>
```

| Type | Use for | Version bump |
|---|---|---|
| `feat` | New user-facing feature | minor |
| `fix` | Bug fix | patch |
| `refactor` | Code restructure with no behaviour change | none |
| `chore` | Deps, tooling, config | none |
| `docs` | Documentation only | none |
| `ci` | CI/CD workflow changes | none |
| `test` | Adding or updating tests | none |

Append `!` after the type (e.g. `feat!:`) or add `BREAKING CHANGE:` in the commit footer for a **major** version bump.

### Examples

```
feat(overview): add claims health stat card
fix(composites): handle missing status conditions gracefully
refactor: restructure src/ layout into feature folders
chore: update headlamp-plugin to 0.15.0
```

## Releasing

Releases are automated via [Release Please](https://github.com/googleapis/release-please).

1. Merge conventional commits to `main`
2. Release Please opens a release PR that bumps `package.json` and updates `CHANGELOG.md`
3. Merge the release PR — the build workflow publishes a GitHub release with the `.tar.gz` attached

Version bumps are determined automatically: `feat:` → minor, `fix:` → patch, `feat!:` → major.
