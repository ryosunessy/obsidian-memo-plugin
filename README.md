# Memo Plugin

Mobile-compatible Obsidian plugin (`isDesktopOnly: false`). Uses only the Obsidian API (no Node.js modules).

Command palette → **Append today's date to end of note** adds a `YYYY-MM-DD` line at the end of the current note.

## Development

```
npm install
npm run dev     # watch
npm run build   # type-check + production bundle
```

## Release

Bump `version` in `manifest.json` (and `versions.json`), commit, then:

```
git tag 1.0.0 && git push origin 1.0.0
```

GitHub Actions builds and attaches `main.js`, `manifest.json`, `styles.css` to the release.
The tag must exactly match the `manifest.json` version.
