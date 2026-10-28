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

The kit's existing components use fixed HTML markup, classes, ids, nesting, CSS, and JavaScript interactions rather than a React/Vue-style component API. Treat index.html as the source of truth for existing components. This is not a prohibition on extending the kit: when existing components cannot reasonably satisfy a requirement, follow the component-extension workflow below.

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

These rules protect Better UI's established design language and existing behavior. They do not prohibit justified, style-consistent component extensions.

1. **Prefer existing components; extend only when needed.**
   - Read the component inventory and inspect index.html before building UI.
   - Reuse an existing component or compose existing rows, lists, fields, dialogs, and controls when that meets the requirement.
   - If the requirement cannot be met cleanly with existing components, you MAY create a new component. Do not claim a new component is built into the kit until it has actually been added to the kit and documented.
2. **Do not arbitrarily restyle existing components.**
   - Preserve existing styles and interactions unless the task explicitly requires changing them.
   - You MAY add CSS for a justified new component. Prefer a separate, component-scoped stylesheet for project-only extensions, or the kit's source stylesheet for upstream contributions.
   - Do not add broad selectors or overrides that change existing Better UI components. Do not use inline styles for visual design. The only allowed inline styles are existing patterns copied from index.html, such as CSS custom properties used for icons or layout values.
3. **Keep the existing shell and component structure intact.**
   - Preserve required ids, classes, and nesting from index.html, including #side, #nav, #sideToggle, #crumb, #agents, #providers, #addSheet, #view-settings, #setTabs, #pop, #pickerRail, #modal, #status, and #period.
   - New components may have their own namespaced classes and ids. Do not rename or repurpose existing hooks.
4. **Use desktop window mode.** The body is <body class="window linux side-nav">.
   - Do not use the web mode: below 760px or on touch screens it enlarges controls to 44px.
   - Do not use mac mode: it reserves 96px for macOS traffic-light buttons.
   - The script adds html.win on Windows.
5. **Follow the navigation contract.** Pages are main elements with class view and ids in the form view-NAME, linked by #nav buttons with data-view="NAME". Address them with the hash #/NAME, not #NAME, because a bare id hash scrolls to that element.
6. **Do not add a morph animation** between sidebar and top-tab layouts. The kit switches layouts directly.
7. **Settings is a page, not a popup.**
   - In side layout, settings lives at the sidebar foot (#prefs), and its categories hang under it as .nav-sub.
   - In top layout, the gear moves to the top-right, category tabs (.warm-tabs#setTabs) sit top-left, and search sits on the right.
8. **Icons:** use original SVGs, not third-party logos or brand icons.
   - Colour icon: a span with class ic containing an img whose source is an SVG data URL.
   - Monochrome icon that follows text colour: a span with class ic containing a span with class mask and the existing --i CSS custom property pattern.
9. **Do not change unrelated parts of the UI.** A component extension must be scoped to the requirement and must not be used as a reason to redesign other pages or loosen the established visual rules.

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

Anything not in this table is **not a built-in component**. This table describes what already ships in the kit; it does not ban new components. If existing components cannot meet a real requirement, follow the extension workflow below instead of inventing a built-in API or forcing an unsuitable component.

## 5. Component discovery and extension workflow

Follow this workflow whenever the user requests a component or interaction that is not already available.

### 5.1 Inspect the real design system first

Before designing a new component, inspect the relevant source files:
- index.html: existing component markup, ids, class names, nesting, and visual examples.
- src/better-ui.css: actual design tokens, selectors, typography, spacing, borders, radii, shadows, theme rules, responsive rules, and component states.
- src/better-ui.js: existing interactions, event conventions, accessibility behavior, and public BUI APIs.
- example.js: how the example app wires data and handlers without adding its own styling.
- build.js: how source files are assembled into the distributable better-ui.js.

Do not infer the design system from screenshots or README descriptions alone when source is available. Use the closest existing component as the baseline and preserve the established visual hierarchy and density.

### 5.2 Define the component before coding

Identify the component's purpose, anatomy, data inputs, events, and user-visible behavior. Consider all applicable states, not only the default state:
- Default, hover, focus-visible, active, selected, disabled, loading, empty, error, and success states.
- Pointer, keyboard, focus management, and dismissal behavior.
- Light and dark themes.
- Wide, narrow, and responsive layouts.
- Long text, missing data, and other realistic edge cases.
- Accessible names, semantic HTML, ARIA state, and keyboard operability.

Do not implement irrelevant states just to satisfy a checklist; identify which states apply and implement those consistently.

### 5.3 Derive styling from existing patterns

- Reuse existing CSS variables, colours, typography, spacing, radii, borders, shadows, and transition conventions wherever suitable.
- Match the surrounding UI's visual hierarchy, compactness, alignment, and interaction patterns. Matching only the colours is not enough.
- Use the kit's existing SVG/icon conventions. Do not add third-party brand icons.
- New CSS is allowed when needed, but scope selectors under a unique component root or prefix. Avoid global element selectors and broad rules that could change existing components.
- Prefer a separate stylesheet for a project-local extension and load it after better-ui.js. Do not put a new component's full stylesheet into an inline style block.
- Avoid inline visual styling. Use inline CSS custom properties only when needed for dynamic values and consistent with existing patterns.
- Do not introduce a second design system, unnecessary animation, or new dependencies without a concrete technical reason.

### 5.4 Implement the complete behavior

A new component must be more than a static visual mockup when the requirement implies interaction. Implement its required event handling, state changes, focus behavior, dismissal, validation, and empty/error handling. Reuse BUI APIs and existing events where they fit; do not invent undocumented BUI APIs or modify the meaning of existing events.

Keep component-specific JavaScript isolated and avoid polluting global scope. Use native HTML controls where practical, and preserve keyboard and assistive-technology access.

### 5.5 Choose the correct integration path

Determine whether the component is project-specific or generally reusable.

**Project-local extension**
- Keep the component in the user's application, separate from the Better UI distribution.
- Add only the necessary HTML, CSS, JavaScript, and assets. Organize files according to the host project's conventions.
- Load the Better UI kit first, then the component's scoped CSS; load component logic at the appropriate point in the application.
- Do not edit the kit's src files or generated better-ui.js just to support a component used by one project.
- Do not submit a public PR for a component that is tightly coupled to the user's app, data, or private requirements.

**Upstream Better UI component**
- Use this path when the component has clear value for other Better UI users and fits the kit's scope.
- Implement in the source architecture. Do not edit generated better-ui.js as the only source of truth.
- If using existing source files, update src/better-ui.css and/or src/better-ui.js as appropriate. If adding a source file, update build.js so the file is included in the build.
- Rebuild better-ui.js with node build.js and keep the generated bundle in sync with the source.
- Add a representative example and working interactions to index.html and example.js.
- Update the component inventory and relevant README documentation so future agents and users can discover the new component.
- Preserve existing APIs and behavior. If a breaking change is genuinely necessary, document the reason and impact clearly.

### 5.6 Compare and verify

Compare the new component with the closest existing component in the real example app at the same viewport size. Check light and dark themes, wide and narrow windows, and every applicable interaction state. Fix visual or functional regressions before calling the component complete. Do not claim visual verification if screenshots or browser checks were not actually performed.

## 6. GitHub pull request workflow

Any agent using this skill may propose a generally reusable component to the upstream Better UI repository by opening a pull request when the required GitHub access or connector is available. This applies to agents acting for any user; it is not restricted to the repository owner.

**The permission is to prepare and submit a PR only. It is not permission to merge.**
- Never commit or push directly to main, even if the credentials technically allow it.
- Create a dedicated feature branch from the appropriate base branch, make and commit the changes there, and open a pull request against the upstream repository.
- Never merge the PR, enable auto-merge, or claim that it was merged.
- Do not ask for an extra approval solely to open a PR when the task calls for a reusable contribution and the available GitHub authorization permits it.
- If the agent cannot push to the upstream repository, use a fork-based PR workflow when supported and authorized. If neither route is available, provide the patch and a complete PR description without claiming that a PR was opened.
- Do not make unrelated repository changes or perform unrelated GitHub actions as part of the contribution.

Before opening the PR:
1. Confirm the component is reusable beyond the originating app and follows the design system.
2. Ensure source files, generated bundle, example app, component inventory, and documentation are consistent.
3. Run the build and relevant tests. Check the available CI status if accessible; report any checks that could not be run.
4. Inspect the diff for unrelated changes, accidental generated noise, and regressions.
5. Prepare a clear PR title and description covering the motivation, component behavior, implementation, usage example, screenshots where useful, tests performed, and compatibility considerations.

Open the PR only after the change is coherent and reviewable. A PR being open is the successful end of this workflow; merging remains the responsibility of the repository maintainer.

## 7. Public API and behavior discipline

Treat the documented BUI API and existing component behavior as the compatibility contract. Do not invent public APIs and then present them as supported. If an extension needs a new public API:
- Keep the API small and consistent with existing naming and event conventions.
- Document arguments, return values, events, and failure behavior.
- Include a working example and test the new behavior.
- Preserve existing APIs unless a documented breaking change is explicitly accepted.

## 8. JavaScript API (`window.BUI`)

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

## 9. Check before delivering

1. Open the page with Playwright at about 1280px and 900px wide, in light and dark (`prefers-color-scheme`). Screenshot it and compare each component with the same component in `index.html` at the same width.
2. Audit class names and styles. For built-in components, confirm that classes and nesting match index.html. For a new component, verify that every new class is intentionally defined in its scoped stylesheet or kit source; do not leave accidental or undocumented classes. Existing harmless hooks such as .v and .n should be checked against index.html.
3. Do not add a new inline style block for a component. Pages using only built-in components should use the kit stylesheet alone. A justified new component may use a separate, scoped stylesheet; confirm it does not override or restyle existing Better UI classes.
4. For upstream contributions, rebuild with node build.js, confirm better-ui.js matches the source, update the example and component inventory, inspect the diff, and open a PR without merging it.
