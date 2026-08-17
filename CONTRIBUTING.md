# Contributing

## Development

```bash
node --test test/          # unit tests (main-module mode under the DSH sandbox)
```

## Code style

- Plain JavaScript (ESM), no TypeScript, no bundler.
- Pure logic modules stay dependency-free and unit-tested in isolation.
- New behavior needs a unit test.

## Releasing

Bump `version` in `package.json`, update `CHANGELOG.md`, then:

```bash
npm version patch -m "chore: release v%s"
git push --tags           # CI publishes to npm automatically
```
