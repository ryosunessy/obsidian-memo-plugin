# Memo Plugin

Mobile-compatible Obsidian plugin (`isDesktopOnly: false`). Uses only the Obsidian API (no Node.js modules).

When you come back to Obsidian after **4+ hours of inactivity and the date has changed**, the previous day's daily note is closed and today's daily note is opened (created if missing).

- Uses the core Daily Notes settings (folder, date format, template) when available; otherwise `YYYY-MM-DD` in the vault root.
- Command palette → **Open today's daily note** opens/creates today's note manually.

## Development

```
npm install
npm run dev     # watch
npm run build   # type-check + production bundle
```

## Release

Bump `version` in `manifest.json` (and `versions.json`), commit, then:

```
git tag 1.1.0 && git push origin 1.1.0
```

GitHub Actions builds and attaches `main.js`, `manifest.json`, `styles.css` to the release.
The tag must exactly match the `manifest.json` version.
