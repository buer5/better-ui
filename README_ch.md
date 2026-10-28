# better-ui

[English](README.md) | **中文**

一个桌面应用风格的 UI 工具包：

-   侧边栏或顶部标签页导航；
-   列表行、开关、分段控件；
-   下拉选择器、行菜单、编辑对话框和确认对话框；
-   实时流程图、用量卡片和设置页面。

它以一个无依赖的 JS 文件交付，并附带一个示例应用 “Perch”（一个虚构的家庭服务器控制台）。

**在线演示：** [https://buer5.github.io/better-ui/](https://buer5.github.io/better-ui/)

![](docs/screenshots/services.png)

服务

|  |  |
| --- | --- |
| ![Sync, dark](docs/screenshots/sync-dark.png) | ![Usage](docs/screenshots/usage.png) |
| ![Picker](docs/screenshots/picker.png) | ![Settings in the top layout](docs/screenshots/settings-top.png) |
| ![Add storage, dark](docs/screenshots/add-storage-dark.png) | ![Editor](docs/screenshots/editor.png) |

## 文件结构

```
better-ui/
├── better-ui.js         发布版：将样式与交互整合在一个文件中，无外部依赖（由 build.js 构建）
├── src/better-ui.css    样式源文件
├── src/better-ui.js     脚本源文件
├── build.js             将 src/ 中的文件合并为 better-ui.js：运行 node build.js
├── index.html           示例页面，以及所有组件的参考 HTML 结构（GitHub Pages 首页）
├── example.js           示例页面专用的数据与事件处理逻辑（不包含样式）
├── docs/screenshots/    README 文档使用的截图
├── skill/SKILL.md       面向 AI 编程 Agent 的技能文件：指导 Agent 使用这套组件库构建页面
└── LICENSE              许可证文件
```

## 快速开始

无需下载文件，直接通过 jsDelivr 加载：

```html
<script src="https://cdn.jsdelivr.net/gh/buer5/better-ui@main/better-ui.js"></script>
```

-   **只需要这一个文件。** 将它放在 `<head>` 中且不要添加 `defer`。这样样式会在首次绘制前加载，避免页面短暂显示为无样式状态；交互逻辑会在页面加载后挂载。
-   **页面结构请参照 `index.html`**（见下文“使用方法”）。

### 桌面窗口模式

使用 `<body class="window linux side-nav">`。不要改用以下模式：

-   **`web`**：视口宽度小于 760px 或设备支持触摸时，会将按钮、输入框和分段控件增大到 44px，方便触控操作。
-   **`mac`**：会为 macOS 窗口左上角的红绿灯按钮预留 96px 空间。

在 Windows 上，脚本会为 `html` 添加 `win` 类，从而切换到 Segoe UI 字体。

## 使用方法

这不是 React/Vue 风格的组件库，而是*固定的 HTML 结构及与之对应的样式*：按照 `index.html` 中的结构编写 HTML，工具包的样式便会自动应用。

```html
<script src="better-ui.js"></script>  <!-- in <head> -->
<body class="window linux side-nav">
  <aside class="sidebar" id="side">…</aside>
  <header class="top">…</header>
  <main class="view" id="view-xxx">…</main>
  <footer class="foot"><span id="status" class="status" role="status"></span></footer>
  <div class="modal" id="modal" hidden><div class="dialog"></div></div>
  <div id="pop" class="pop" hidden>…</div>
</body>
```

许多规则会定位特定 ID，例如 `#side`、`#nav`、`#agents`、`#providers`、`#view-settings`、`#setTabs`、`#pop`、`#modal` 和 `#status`，因此页面需要保留相同的 ID。最简单的做法是从 `index.html` 复制完整区块，再替换其中的内容。

### 部分组件示例（摘自 index.html）

带有状态行、选择器字段和开关的列表行（服务行）：

```html
<div class="list" id="agents">
  <div class="row agent conn" data-id="photo">
    <button class="ag-handle" type="button" aria-haspopup="menu"><span class="ic"><img src="…" alt=""></span></button>
    <div class="who with-models">
      <div class="name">Photo sync</div>
      <div class="ag-st on"><span class="ag-dot"></span><span class="ag-st-t">Running · 12,480 photos synced</span></div>
    </div>
    <button class="ag-link" type="button"><span>Details</span><span class="chev"><svg…/></span></button>
    <button class="field ag-start"><span class="k">Storage</span><span class="v">NAS main</span><span class="chev"><svg…/></span></button>
    <button class="lib-switch ag-conn on" type="button" role="switch" aria-checked="true"><i></i></button>
  </div>
</div>
```

分段控件（设置中的开/关选项）：

```html
<div class="segs" data-kind="off|on">
  <span class="thumb"></span>
  <button class="opt on" type="button" aria-pressed="true">Off</button>
  <button class="opt" type="button" aria-pressed="false">On</button>
</div>
```

设置项：

```html
<div class="list prefs">
  <div class="row pref">
    <div class="who"><div class="name">Prevent sleep</div><div class="sub">Keep this machine awake while a backup runs</div></div>
    <div><div class="segs">…</div></div>
  </div>
</div>
```

存储行：

```html
<div class="row provider" data-id="nas">
  <button class="ag-handle pv-handle" type="button"><span class="ic"><span class="mask" style="--i:url(…)"></span></span></button>
  <div class="who"><div class="name">NAS main</div><div class="sub">smb://nas.local/main · 3 services</div></div>
  <div class="uses"></div>
  <span class="key on"><span>smb://nas</span></span>
  <button class="lib-switch pswitch on" role="switch" aria-checked="true"><i></i></button>
  <span class="chev"><svg…/></span>
</div>
```

图标有两种形式：

-   **彩色图标：** `<span class="ic"><img src="…"></span>`。
-   **单色图标**会跟随文本颜色变化：`<span class="ic"><span class="mask" style="--i:url(…)"></span></span>`。

### JS

```js
BUI.go("settings");                         // switch view (#view-settings); the URL shows #/settings
BUI.layout.toggle();  BUI.layout.set(true);  // sidebar ⇄ top tabs
BUI.picker(fieldButton, {                    // the #pop picker
  items: [{ group: "Local", icon: "…" }, { value: "a", label: "NAS main", note: "Local · 8 TB", icon: "…" }],
  value: "a", rail: true, favorites: new Set(), placeholder: "Filter…",
  onPick: (it) => {},
});
BUI.menu(anchor, [{ label: "Move up", key: "Alt+↑", icon: "M8 12.5v-9…" }, "-", { label: "Hide" }]);  // .row-menu
BUI.modal(editorElement);  BUI.closeModal();   // #modal > .dialog > .editor (.ehead / .ebody / .bar)
BUI.confirm("Delete?", "Explanation", "Delete").then((ok) => {});  // .action-confirm dialog
BUI.status("Saved", "ok");                     // footer #status; floats as a pill while a dialog is open
el.addEventListener("pick", (e) => e.detail.index);    // .segs / .warm-tabs
el.addEventListener("toggle", (e) => e.detail.on);     // .lib-switch
document.addEventListener("bui:view", (e) => e.detail.view);
```

以下功能无需编写自己的 JavaScript 即可使用：

-   `.segs` 滑块、`.warm-tabs`、`.lib-switch` 和 `.agent-more` 折叠交互；
-   通过拖拽调整侧边栏宽度；
-   使用 ⌘/Ctrl+, 打开设置。

## 两种导航布局

-   **窗口宽度 ≥ 1024px：左侧边栏。**
    -   页面按分组排列，当前页面以白色块状高亮显示。
    -   设置入口位于侧边栏底部；打开后，设置分类会显示在其下方。
    -   顶部标题栏显示“分组 / 页面 / 分类”，设置搜索框移至标题栏右侧。
-   **较窄窗口：居中的顶部标签页。**
    -   设置按钮位于右上角。
    -   在设置页面内，分类标签（小型大写字母样式）位于左上角，搜索框位于右侧；所在行会固定在顶部。
-   **更窄的窗口：** 标题栏会分阶段收紧：先隐藏名称，再缩小标签间距，随后缩小字体，最后允许标签页横向滚动。
-   **手动切换：** 点击标题栏左侧的按钮即可切换布局，选择会被记住。拖动侧边栏右边缘可以调整宽度。
-   **不使用过渡动画：** 两种布局之间直接切换。

## 示例应用中的组件

| 页面 | 组件（类名） |
| --- | --- |
| 外壳布局 | `.sidebar` `#nav.seg` `.nav-gl` `.nav-top-hl` `.nav-sub` `.nav-hl` `.side-gw` `header.top` `.crumb` `.side-toggle` `.icon` `.update` `.foot` `.status` |
| 服务 | `.ag-lead` `.list` `.row.agent` `.ag-handle` `.ag-st` `.ag-link` `.field` `.lib-switch` `.ag-cant` `.ag-manage-bar` `.agent-more` `.agent-fold` `.profiles` `.chips` `.chip` |
| 存储 | `.row.provider` `.key` `.pswitch` `.after-list` `#addSheet.sheet` `.row-head` `.find` `.kind` `.grid` `.tile` `.custom-foot` |
| 存储 › 编辑 | `#modal` `.dialog` `.editor.framed` `.ehead` `.ebody` `.bar` |
| 同步 | `.rt` 实时卡片、`.rt-stage` 流程图、`.rt-hub` `.rt-accts` `.rt-stats` `.rt-steps`、请求列表、账户列表 |
| 用量 | `.usage-head` `.segs#period` 配额卡片、`.stats` `.kpi` `.chart`、按服务 / 存储分类的列表行 |
| 设置 | `.set-head` `.warm-tabs` `.sess-filter` `.set-page` `.prefs` `.row.pref` `.segs` `.sess-pick` |
| 覆盖层 | `#pop` 选择器（含 `#pickerRail` 图标栏、`.rail-tip`、`.favorite`）、`.pop.row-menu`、`.action-confirm` |

## Skill

`skill/SKILL.md` 是标准格式的 Skill 文件。安装后，可以要求 Agent“使用 better-ui 构建一个……页面”。它会：

-   从此仓库获取工具包；
-   只使用此工具包中实际存在的组件；
-   遵循 `index.html` 的结构，不自行臆造样式。

**macOS / Linux：**

```bash
# Claude Code, ZCode (OpenCode)
mkdir -p ~/.claude/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.claude/skills/better-ui/SKILL.md

# Codex CLI, DeepSeek Harness (dsh) (OpenCode)
mkdir -p ~/.agents/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.agents/skills/better-ui/SKILL.md

# WorkBuddy
mkdir -p ~/.workbuddy/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.workbuddy/skills/better-ui/SKILL.md
```

**Windows（PowerShell）：**

```powershell
$u = "https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md"
# Claude Code, ZCode
New-Item -ItemType Directory -Force "$HOME\.claude\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$HOME\.claude\skills\better-ui\SKILL.md"
# Codex CLI, DeepSeek Harness (dsh), OpenCode
New-Item -ItemType Directory -Force "$HOME\.agents\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$HOME\.agents\skills\better-ui\SKILL.md"
# WorkBuddy
New-Item -ItemType Directory -Force "$env:APPDATA\WorkBuddy\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$env:APPDATA\WorkBuddy\skills\better-ui\SKILL.md"
```
| 工具 | Skill 的读取位置 |
| --- | --- |
| Claude Code | `~/.claude/skills/`、项目内 `.claude/skills/` |
| Codex CLI | `~/.agents/skills/`、项目内 `.agents/skills/` |
| ZCode | 与 Claude Code 相同 |
| DeepSeek Harness（dsh） | `~/.agents/skills/`；安装后需重启 dsh |
| OpenCode | `~/.config/opencode/skills/`、`~/.claude/skills/`、`~/.agents/skills/`；项目内 `.opencode/skills/`、`.claude/skills/`、`.agents/skills/` |
| WorkBuddy | `~/.workbuddy/skills/`（Windows：`%APPDATA%\WorkBuddy\skills\`） |
| ChatGPT | 没有本地目录：在聊天中说“Build me a skill”，粘贴 [SKILL.md](http://SKILL.md)，然后点击 Install |
| Claude（网页端 / 桌面端） | Settings › Capabilities › Skills：将 `skill` 文件夹打包为 ZIP 后上传 |
| WorkBuddy | `~/.workbuddy/skills/`（Windows：`%APPDATA%\WorkBuddy\skills\`） |
| ChatGPT | 没有本地目录：在聊天中说“Build me a skill”，粘贴 [SKILL.md](http://SKILL.md)，然后点击 Install |
| Claude（网页端 / 桌面端） | Settings › Capabilities › Skills：将 `skill` 文件夹打包为 ZIP 后上传 |

## 修改与构建

编辑 `src/` 中的文件，然后运行 `node build.js` 重新构建 `better-ui.js`。无需安装任何依赖。

## 许可证

MIT; see [LICENSE](LICENSE). The style rules are © 2026 yetone, under the MIT License.