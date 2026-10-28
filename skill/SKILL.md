---
name: better-ui
description: Build desktop-style web UIs (control panels, settings pages, dashboards, app shells) with the better-ui kit. Use when the user asks for better-ui or a page in this style.
---

# better-ui

better-ui is a desktop-app style UI kit:

- `better-ui.js` is the whole kit in one file: it injects the styles and provides the interactions, with no dependencies.
- `index.html` is a complete example app ("Perch"). It is also the reference markup for every component.
- `src/better-ui.css` and `src/better-ui.js` are the sources that `build.js` combines into `better-ui.js`.

Repository: https://github.com/buer5/better-ui

This kit is **not** a component library with its own API. It is *fixed markup plus the CSS written for it*. A page looks right only when it uses the same tags, classes, ids and nesting as `index.html`. Treat `index.html` as the source of truth for every component.

## 1. Get the files

1. Fetch the raw files you need to read (with WebFetch, or `curl` if the shell can reach GitHub):
   - `https://raw.githubusercontent.com/buer5/better-ui/main/index.html`
   - `https://raw.githubusercontent.com/buer5/better-ui/main/example.js`
2. Don't copy the kit into the page. Load the single file from the CDN, in `<head>`, without `defer` (so the styles land before the first paint):
   ```html
   <script src="https://cdn.jsdelivr.net/gh/buer5/better-ui@main/better-ui.js"></script>
   ```
   If the page must work offline, download `better-ui.js` and load it locally the same way.
3. If fetching fails, `git clone https://github.com/buer5/better-ui`. If that also fails, ask the user to attach the repo zip.

**Always read `index.html` before writing markup.** Copy the block for each component you need, then change only the content.

## 2. Hard rules

These come from the user who commissioned the kit. Breaking them is what made earlier attempts "fall apart".

1. **Only use components that exist in the kit.** Don't invent new widgets, cards or layouts.
   - If what the user wants has no counterpart in `index.html`, compose it from existing rows, lists and fields.
   - If that isn't possible, say it isn't in the kit.
2. **Don't modify or add CSS.**
   - Leave the kit's styles (`src/better-ui.css`, embedded in `better-ui.js`) alone.
   - Don't add a stylesheet that restyles kit classes.
   - Don't use inline styles for look and feel. The only allowed inline style is a CSS custom property that `index.html` also sets inline, such as `--i:url(…)` on `.mask` or `--extras` on `#agents`.
3. **Keep the classes, ids and nesting from `index.html`.**
   - Many rules target ids: `#side`, `#nav`, `#sideToggle`, `#crumb`, `#agents`, `#providers`, `#addSheet`, `#view-settings`, `#setTabs`, `#pop`, `#pickerRail`, `#modal`, `#status`, `#period`. Pages must use the same ids.
   - To style another list like `#agents`, reuse that page block's structure rather than renaming it.
4. **Use desktop window mode.** The body is `<body class="window linux side-nav">`.
   - Not `web`: it enlarges controls to 44px at ≤760px.
   - Not `mac`: it adds 96px of traffic-light padding.
   - The script adds `html.win` on Windows.
5. **Pages are `<main class="view" id="view-NAME">`, linked by `#nav button[data-view="NAME"]`.** Address them with the hash `#/NAME`, not `#NAME`: a bare id hash scrolls to that element.
6. **Don't add a morph animation** between the sidebar and top-tab layouts. Switching swaps directly, as the kit already does.
7. **Settings is a page, not a popup.**
   - Side layout: settings lives at the sidebar foot (`#prefs`), and its categories hang under it as `.nav-sub`.
   - Top layout: the gear moves to the top-right, the category tabs (`.warm-tabs#setTabs`) sit top-left, and search sits on the right.
8. **Icons:**
   - Use your own SVGs, never third-party logos or brand icons.
   - Colour icon: `<span class="ic"><img src="data:image/svg+xml,…" alt=""></span>`.
   - Monochrome icon that follows the text colour: `<span class="ic"><span class="mask" style="--i:url(…)"></span></span>`.

## 3. Page skeleton

Copy the full shell from `index.html`:

- everything from `<aside class="sidebar" id="side">` through `</header>`;
- the closing `.foot`, `#modal`, `#pop` and `<template id="tplEditor">` blocks.

Then replace the brand, the nav groups and buttons, and the views. Outline:

```html
<head>…<script src="…/better-ui.js"></script></head>
<body class="window linux side-nav">
<aside class="sidebar" id="side">
  <div class="side-top"><div class="brand"><span class="logo">…svg…</span><span>App</span></div></div>
  <div class="side-scroll"><nav class="seg hl-on" id="nav" aria-label="Main navigation">
    <span class="nav-gl">Group</span>
    <button data-view="home" class="on" aria-current="page"><svg class="nav-ic" …/><span>Home</span></button>
    <i class="nav-top-hl"></i></nav></div>
  <div class="side-foot"><button class="icon" id="prefs">…gear…<span class="side-l">Settings</span></button>
    <button type="button" class="side-gw" id="sideGw"><i></i><span>status line</span></button></div>
  <div class="side-edge" id="sideEdge" role="separator" …></div>
</aside>
<header class="top">
  <button type="button" class="icon side-toggle" id="sideToggle" …>…</button>
  <div class="crumb" id="crumb" aria-hidden="true"><span>Group</span><i>/</i><b>Home</b></div>
  <div class="actions">…icon buttons…</div>
</header>
<main class="view" id="view-home" tabindex="-1">…</main>
…more views, including view-settings…
<footer class="foot"><span id="status" class="status" role="status"></span></footer>
<div class="modal" id="modal" hidden><div class="dialog"></div></div>
<div id="pop" class="pop" hidden>…copy from index.html…</div>
<script src="app.js"></script>  <!-- your own logic -->
</body>
```

`better-ui.js` wires the nav, crumb and settings categories from `data-view`. Keep `#view-settings` in the same shape as the example:

- `.set-head`, containing `.warm-tabs#setTabs` and `.sess-filter`;
- then `.set-page` sections of `.list.prefs > .row.pref`.

## 4. Components available

Find each component in `index.html` by its class and copy that block.

| Need | Component | Where in index.html |
|---|---|---|
| Intro line above a list | `.ag-lead` | `#view-agents` |
| List of items with status, picker field and switch | `.list#agents > .row.agent` (`.ag-handle`, `.who`, `.ag-st`, `.ag-link`, `.field`, `.lib-switch`) | `#view-agents` |
| Expandable extra rows | `.agent-more` + `.agent-fold` | `#view-agents` |
| Chips | `.chips > .chip` | `#view-agents` (`.profiles`) |
| Secondary list with key and switch | `.row.provider` (`.key`, `.pswitch`, `.chev`) | `#view-providers` |
| "Add" panel with search and a tile grid | `#addSheet.sheet` (`.row-head`, `.find`, `.kind`, `.grid > .tile`, `.custom-foot`) | `#view-providers` |
| Editor dialog | `.editor.framed` (`.ehead`, `.ebody`, `.bar`) opened with `BUI.modal` | `#tplEditor`; see example.js |
| Live flow card with diagram, stats and steps | `.rt` (`.rt-stage`, `.rt-hub`, `.rt-accts`, `.rt-stats`, `.rt-steps`), request list, account list | `#view-routing` |
| Period switch, quota cards, KPIs, chart, breakdown rows | `.usage-head`, `.segs#period`, quota cards, `.stats`, `.kpi`, `.chart` | `#view-usage` |
| Settings rows | `.list.prefs > .row.pref` with `.segs` or `.sess-pick` | `#view-settings` |
| Segmented control | `.segs > .thumb + .opt…` | anywhere |
| Toggle | `.lib-switch[role=switch] > i` | anywhere |
| Dropdown picker | `#pop` via `BUI.picker` (icon rail, favourites, filter) | JS |
| Row context menu | `.pop.row-menu` via `BUI.menu` | JS |
| Confirm dialog | `.action-confirm` via `BUI.confirm` | JS |
| Status message | `#status` via `BUI.status` | JS |

Anything not in this table is **not** in the kit: for example a sessions or library page, drag reordering, or new card types. Don't imitate or invent it.

## 5. JavaScript API (`window.BUI`)

```js
BUI.go("settings");                  // switch view; the hash becomes #/settings
BUI.layout.toggle(); BUI.layout.set(true);   // sidebar ⇄ top tabs (auto: side at ≥1024px)
BUI.picker(fieldButton, { items: [{ group: "Local", icon }, { value: "a", label: "Disk A", note: "8 TB", icon }],
  value: "a", rail: true, favorites: new Set(), placeholder: "Filter…", onPick: (it) => {} });
BUI.menu(anchor, [{ label: "Move up", key: "Alt+↑", icon: "M8 12.5v-9…" }, "-", { label: "Hide" }]);
BUI.modal(editorEl); BUI.closeModal();
BUI.confirm("Delete?", "Explanation", "Delete").then((ok) => {});
BUI.status("Saved", "ok");
segsOrWarmTabs.addEventListener("pick", (e) => e.detail.index);
libSwitch.addEventListener("toggle", (e) => e.detail.on);
document.addEventListener("bui:view", (e) => e.detail.view);
```

These work without any extra code:

- `.segs` thumbs, `.warm-tabs`, `.lib-switch`, and `.agent-more` folding.
- Sidebar drag-resize, and Ctrl/⌘+, to open settings.
- Narrow-width header tightening, quota card packing, and the flow diagram's width classes and wires.

App logic (data and handlers) goes in your own script at the end of `<body>`, as `example.js` does.

## 6. Check before delivering

1. Open the page with Playwright at about 1280px and 900px wide, in light and dark (`prefers-color-scheme`). Screenshot it and compare each component with the same component in `index.html` at the same width.
2. List the classes your page uses that don't appear in the kit's styles (`src/better-ui.css`, or `better-ui.js`, which embeds them). An unknown class may mean an invented component:
   ```bash
   grep -o 'class="[^"]*"' page.html | sed 's/class="//; s/"$//' | tr ' ' '\n' | sort -u | while read c; do [ -n "$c" ] && ! grep -q "\.$c\b" better-ui.js && echo "unknown: $c"; done
   ```
   Some unknown classes are harmless hooks that `index.html` also uses (for example `.v`, `.n`). Check each one against `index.html`.
3. Make sure the page has no `<style>` block and no stylesheet of its own: all styling comes from `better-ui.js`.
