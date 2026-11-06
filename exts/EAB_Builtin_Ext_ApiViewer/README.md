# API Reference (API viewer)

Shows every host API an extension may call, straight from the host: the
**payload** and **return** fields, a **runnable example**, the **version** the API
is at, and the **history** of what changed in which release.

The page has no copy of the list. On load it asks the host:

```js
API_EAB_listApis({}).then(r => r.apis);   // [{ api, command, kind, category, since,
                                          //    version, status, summary, payload[],
                                          //    returns[], example, history[] }, …]
```

The answer also carries the catalogue `version`, its `released` date, the bridge
`shell` version the host injects, `releases[]` (the release notes) and a `note`
explaining how to read the version fields — so an API added to the host shows up
here without touching this extension.

## GUI

Extension panel → **API Reference** 📚, or **Help → API Reference** in the menu bar.

* **Left card** — search box (API name, command, summary, history text), a chip
  row per category plus `helpers`, and the list. A row's dot is amber when that
  API changed in the catalogue's current version.
* **Right card** — the selected API: kind, category, `since`, current version and
  status badges, the summary, the call signature, payload and return tables, the
  example with a *Copy* button, and the history newest first.
* **Releases card** — the catalogue's release notes, so "what changed in 3.1" is
  one glance away.

Selecting a row only re-renders the detail card; the list keeps its scroll and
filter. The example is copied with the clipboard API and falls back to a hidden
textarea on hosts that refuse it.

## Where the data comes from

The single source of truth is the host's catalogue,
`src/config/apiCatalog.ts` — **not** this folder. Its `version` must match
`API_VERSION` in `src/ext-shell/eab-api.js`, every bridge command must have an
entry, and `scripts/check_shell_boundary.py` fails the build when either rule
breaks. So a new API is documented once, in the host, and this page renders it.

## Manifest

No DLL and no CLI command: the page is pure UI (`"app_dlls": []`,
`"cli_commands": []`) and needs only `gui.render` / `gui.components`. It
contributes the **Help → API Reference** menu entry, and stays in the toolbar
(`show_in_toolbar` defaults to true).
