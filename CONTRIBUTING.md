# Contributing

- `lib/match.js` is dependency-free logic (tokenize/score/search); `lib/guide-data.json` is pure data.
- `lib/index.js` is the Cordis plugin.
- Run `node test/match.test.mjs` (main-module mode under the DSH sandbox).
- Add curated entries by editing `lib/guide-data.json`.
