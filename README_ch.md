# better-ui

[English](README.md) | **中文**

一套桌面应用风格的界面：侧边栏 / 顶部页签两种导航、列表行、开关、分段控件、下拉选择器、行菜单、编辑框、确认框、流向图、用量卡片、设置页。只有一个无依赖的 JS 文件，配一个示例应用「Perch」（虚构的家庭服务器控制台）。

**在线示例：** https://buer5.github.io/better-ui/

![服务页](docs/screenshots/services.png)

| | |
|---|---|
| ![同步页，深色](docs/screenshots/sync-dark.png) | ![用量页](docs/screenshots/usage.png) |
| ![选择器](docs/screenshots/picker.png) | ![顶部布局下的设置页](docs/screenshots/settings-top.png) |
| ![添加存储，深色](docs/screenshots/add-storage-dark.png) | ![编辑框](docs/screenshots/editor.png) |

## 文件

```
better-ui/
├── better-ui.js         发布文件：样式 + 交互合在一个文件里，无依赖（由 build.js 生成）
├── src/better-ui.css    样式源文件
├── src/better-ui.js     交互源文件
├── build.js             把 src/ 合成 better-ui.js：node build.js
├── index.html           示例页面，也是每个组件的标准写法（GitHub Pages 首页）
├── example.js           示例自己的数据和事件处理（不含任何样式）
├── docs/screenshots/    README 里的截图
├── skill/SKILL.md       AI 编程助手的 skill：让 AI 用这套组件搭界面
└── LICENSE
```

## 快速开始

不用下载，直接用 jsDelivr：

```html
<script src="https://cdn.jsdelivr.net/gh/buer5/better-ui@main/better-ui.js"></script>
```

只要这一个文件。放在 `<head>` 里、不加 `defer`：样式在页面画出来之前就位，不会闪一下没样式的页面；交互会等页面加载完再接上。

然后照着 `index.html` 的结构写页面（见下文"怎么用"）。

### 桌面窗口模式

`<body class="window linux side-nav">`。不要换成 `web`（窄于 760px 或触屏时会把按钮、输入框、分段控件都放大到 44px 给手指点），也不要用 `mac`（会给 macOS 的红绿灯按钮留出 96px 空白）。Windows 上脚本会自动加 `html.win`，换成 Segoe UI 字体。

## 怎么用

这不是 React/Vue 那种组件库，而是"一套固定的 HTML 结构 + 对应的样式"：照着 `index.html` 的结构写 HTML，样式就会生效。

```html
<script src="better-ui.js"></script>  <!-- 放在 <head> 里 -->
<body class="window linux side-nav">
  <aside class="sidebar" id="side">…</aside>
  <header class="top">…</header>
  <main class="view" id="view-xxx">…</main>
  <footer class="foot"><span id="status" class="status" role="status"></span></footer>
  <div class="modal" id="modal" hidden><div class="dialog"></div></div>
  <div id="pop" class="pop" hidden>…</div>
</body>
```

注意：样式里有不少规则写在 id 上（`#side`、`#nav`、`#agents`、`#providers`、`#view-settings`、`#setTabs`、`#pop`、`#modal`、`#status` …）。所以页面也要用同样的 id。最省事的做法是从 `index.html` 复制整块结构，再换内容。

### 几个组件的结构（摘自 index.html）

一行带开关和下拉的列表项（服务页的行）：

```html
<div class="list" id="agents">
  <div class="row agent conn" data-id="photo">
    <button class="ag-handle" type="button" aria-haspopup="menu"><span class="ic"><img src="…" alt=""></span></button>
    <div class="who with-models">
      <div class="name">相册同步</div>
      <div class="ag-st on"><span class="ag-dot"></span><span class="ag-st-t">运行中 · 已同步 12,480 张照片</span></div>
    </div>
    <button class="ag-link" type="button"><span>详情</span><span class="chev"><svg…/></span></button>
    <button class="field ag-start"><span class="k">存储</span><span class="v">NAS 主盘</span><span class="chev"><svg…/></span></button>
    <button class="lib-switch ag-conn on" type="button" role="switch" aria-checked="true"><i></i></button>
  </div>
</div>
```

分段控件（设置里的开/关就是它）：

```html
<div class="segs" data-kind="off|on">
  <span class="thumb"></span>
  <button class="opt on" type="button" aria-pressed="true">关闭</button>
  <button class="opt" type="button" aria-pressed="false">开启</button>
</div>
```

设置行：

```html
<div class="list prefs">
  <div class="row pref">
    <div class="who"><div class="name">防止休眠</div><div class="sub">有备份任务在跑时，让这台机器保持唤醒</div></div>
    <div><div class="segs">…</div></div>
  </div>
</div>
```

存储页的行：

```html
<div class="row provider" data-id="nas">
  <button class="ag-handle pv-handle" type="button"><span class="ic"><span class="mask" style="--i:url(…)"></span></span></button>
  <div class="who"><div class="name">NAS 主盘</div><div class="sub">smb://nas.local/main · 3 个服务</div></div>
  <div class="uses"></div>
  <span class="key on"><span>smb://nas</span></span>
  <button class="lib-switch pswitch on" role="switch" aria-checked="true"><i></i></button>
  <span class="chev"><svg…/></span>
</div>
```

图标有两种写法：彩色图标用 `<span class="ic"><img src="…"></span>`；单色图标用 `<span class="ic"><span class="mask" style="--i:url(…)"></span></span>`，颜色跟随文字。

### JS

```js
BUI.go("settings");                         // 换页（#view-settings）；地址栏写作 #/settings
BUI.layout.toggle();  BUI.layout.set(true);  // 侧边栏 ⇄ 顶部页签
BUI.picker(fieldButton, {                    // #pop 选择器
  items: [{ group: "本机", icon: "…" }, { value: "a", label: "NAS 主盘", note: "本机 · 8 TB", icon: "…" }],
  value: "a", rail: true, favorites: new Set(), placeholder: "筛选…",
  onPick: (it) => {},
});
BUI.menu(anchor, [{ label: "上移", key: "Alt+↑", icon: "M8 12.5v-9…" }, "-", { label: "隐藏" }]);  // .row-menu
BUI.modal(editorElement);  BUI.closeModal();   // #modal > .dialog > .editor（.ehead / .ebody / .bar）
BUI.confirm("删除？", "说明", "删除").then((ok) => {});  // .action-confirm 对话框
BUI.status("已保存", "ok");                    // 底栏 #status；对话框打开时浮成胶囊
el.addEventListener("pick", (e) => e.detail.index);    // .segs / .warm-tabs
el.addEventListener("toggle", (e) => e.detail.on);     // .lib-switch
document.addEventListener("bui:view", (e) => e.detail.view);
```

不需要写 JS 就会动的：`.segs` 滑块、`.warm-tabs`、`.lib-switch`、`.agent-more` 折叠、侧边栏拖宽、⌘/Ctrl+, 打开设置。

## 两种导航布局

- 窗口宽度 ≥ 1024px：左侧边栏，页面按组排列；当前页有白色底块；设置在侧边栏底部，打开后它的分类挂在下面；顶栏显示"组 / 页面 / 分类"，设置页的搜索框移到顶栏右侧。
- 更窄：顶部居中页签。设置按钮在右上角；设置页里，分类页签（小号大写）在左上，搜索框在右边，整行吸顶。
- 窄窗口：顶栏逐级收紧——先藏起名字，再把页签挤紧，再缩小字号，最后页签可横向滑动。
- 顶栏左边的按钮可以手动切换，选择会记住；侧边栏右边缘可拖动调宽。
- 两种布局之间的形变动画没有做，切换是直接换。

## 示例里有的组件

| 页面 | 组件（类名） |
|---|---|
| 整体 | `.sidebar` `#nav.seg` `.nav-gl` `.nav-top-hl` `.nav-sub` `.nav-hl` `.side-gw` `header.top` `.crumb` `.side-toggle` `.icon` `.update` `.foot` `.status` |
| 服务 | `.ag-lead` `.list` `.row.agent` `.ag-handle` `.ag-st` `.ag-link` `.field` `.lib-switch` `.ag-cant` `.ag-manage-bar` `.agent-more` `.agent-fold` `.profiles` `.chips` `.chip` |
| 存储 | `.row.provider` `.key` `.pswitch` `.after-list` `#addSheet.sheet` `.row-head` `.find` `.kind` `.grid` `.tile` `.custom-foot` |
| 存储 › 编辑 | `#modal` `.dialog` `.editor.framed` `.ehead` `.ebody` `.bar` |
| 同步 | `.rt` 实时卡片、`.rt-stage` 流向图、`.rt-hub` `.rt-accts` `.rt-stats` `.rt-steps`、请求列表、账号列表 |
| 用量 | `.usage-head` `.segs#period` 额度卡片、`.stats` `.kpi` `.chart` 按服务 / 按存储的统计行 |
| 设置 | `.set-head` `.warm-tabs` `.sess-filter` `.set-page` `.prefs` `.row.pref` `.segs` `.sess-pick` |
| 浮层 | `#pop` 选择器（含 `#pickerRail` 图标栏、`.rail-tip`、`.favorite`）、`.pop.row-menu`、`.action-confirm` |

## 给 AI 编程助手装 skill

`skill/SKILL.md` 是一个通用格式的 skill。装上之后，对 AI 说"用 better-ui 做一个……页面"，它会从这个仓库取文件，只用这里有的组件、按 `index.html` 的结构来写，不自己发明样式。

**macOS / Linux：**

```bash
# Claude Code、ZCode（Muse 也会读这里）
mkdir -p ~/.claude/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.claude/skills/better-ui/SKILL.md

# Codex CLI（Muse 也会读这里）
mkdir -p ~/.agents/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.agents/skills/better-ui/SKILL.md

# WorkBuddy
mkdir -p ~/.workbuddy/skills/better-ui && curl -fsSL https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md -o ~/.workbuddy/skills/better-ui/SKILL.md
```

**Windows（PowerShell）：**

```powershell
$u = "https://raw.githubusercontent.com/buer5/better-ui/main/skill/SKILL.md"
# Claude Code、ZCode
New-Item -ItemType Directory -Force "$HOME\.claude\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$HOME\.claude\skills\better-ui\SKILL.md"
# Codex CLI
New-Item -ItemType Directory -Force "$HOME\.agents\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$HOME\.agents\skills\better-ui\SKILL.md"
# WorkBuddy
New-Item -ItemType Directory -Force "$env:APPDATA\WorkBuddy\skills\better-ui" | Out-Null; Invoke-WebRequest $u -OutFile "$env:APPDATA\WorkBuddy\skills\better-ui\SKILL.md"
```

只想在某一个项目里用：把路径里的 `~/`（`$HOME\`）去掉，在项目根目录运行，即装到 `.claude/skills/` 或 `.agents/skills/`。

| 工具 | 读取位置 |
|---|---|
| Claude Code | `~/.claude/skills/`、项目 `.claude/skills/` |
| Codex CLI | `~/.agents/skills/`、项目 `.agents/skills/` |
| ZCode | 与 Claude Code 相同 |
| Muse Code | `~/.agents/skills`、`~/.claude/skills`、`~/.codex/skills` 都会读；装完用 `muse skills list` 确认 |
| WorkBuddy | `~/.workbuddy/skills/`（Windows：`%APPDATA%\WorkBuddy\skills\`） |
| ChatGPT | 没有本地目录：在聊天里说"Build me a skill"，把 SKILL.md 的内容贴进去，确认后点 Install |
| Claude（网页 / 桌面） | 设置 › Capabilities › Skills 上传 `skill` 文件夹打成的 zip |

## 修改

改 `src/` 里的文件，然后 `node build.js` 重新生成 `better-ui.js`（不需要安装任何东西）。

## 许可

MIT，详见 [LICENSE](LICENSE)。样式规则 © 2026 yetone，MIT 协议。
