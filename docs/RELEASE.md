# Release checklist

1. **Write** — plugin code (dsh.bundle + cordis.patch.yml + lib/index.js).
2. **Verify** — `node --check`; `node test` (main-module mode); `npm pack --dry-run`.
3. **Publish npm** — `pwsh scripts/publish-npm.ps1` (reads token from `$DSH_HOME/secrets/npm-token.txt`), or push a `v*` tag (CI).
4. **Topic** — add `dsh-plugin` to the GitHub repo topics.
5. **awesome PR** — `data/plugins/<owner>__<repo>.yml` + generate-readme.mjs; meet the 1-day / 10-commit bar; re-run CI after 24h if needed.
