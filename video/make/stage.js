// Deterministic timeline: capture.js calls render(t) for every frame, then screenshots.
// Every UI on screen is the real better-ui example page in an iframe; its CSS/WAAPI animations are paused and seeked to t.
const $ = (s, r = document) => r.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: (p) => p,
  io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  out: (p) => 1 - Math.pow(1 - p, 3),
  expo: (p) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  quint: (p) => 1 - Math.pow(1 - p, 5),
  back: (p) => { const c = 1.5; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
const seg = (t, a, b, e = E.io) => e(clamp((t - a) / (b - a)));
// keys: [[time, value, ease?], ...]; the ease on a key shapes the move *into* it
function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = E.io] = keys[i];
    if (t <= t1) { const [t0, v0] = keys[i - 1]; return lerp(v0, v1, e((t - t0) / (t1 - t0))); }
  }
  return keys[keys.length - 1][1];
}

const DUR = 41;
const W0 = 1100, H = 820, AX = 540, AY = 1040;
const f1 = $("#f1"), f2 = $("#f2"), frame = $("#frame");

// ---------- text blocks: split into per-character spans ----------
const blocks = {};
function split(id) {
  const el = $("#" + id), chars = [];
  const walk = (n) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of c.textContent) { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; frag.append(s); chars.push(s); }
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && c.tagName !== "svg") walk(c);
    }
  };
  walk(el);
  blocks[id] = { el, chars };
}
// tin/tout: block in/out; st: per-char stagger; d: per-char duration; bl: start blur
function text(id, t, tin, tout, { st = 0.028, d = 0.7, bl = 12, y = 0.42 } = {}) {
  const b = blocks[id];
  const on = t >= tin - 0.01 && t <= tout + 0.6;
  b.el.style.display = on ? "" : "none";
  if (!on) return;
  const q = seg(t, tout, tout + 0.5, E.io);
  b.chars.forEach((c, j) => {
    const p = E.quint(clamp((t - tin - j * st) / d));
    const op = p * (1 - q), blur = (1 - p) * bl + q * 10, ty = (1 - p) * y - q * 0.25;
    c.style.opacity = op.toFixed(3);
    c.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
    c.style.transform = `translateY(${ty.toFixed(3)}em)`;
  });
}

// ---------- component cards: each is the example page cropped to one component ----------
// x/y/w/h: card on stage; crop: [x, y, w, h] in page px; view: page to show first
const CARDS = [
  { id: "row", page: "A", x: 70, y: 684, w: 940, h: 100, crop: [221, 70, 870, 72], view: "agents", zh: "列表行", cls: ".row" },
  { id: "sw", page: "A", x: 70, y: 868, w: 380, h: 256, crop: [1015, 82, 80, 50], view: "agents", zh: "开关", cls: ".lib-switch" },
  { id: "segs", page: "A", x: 474, y: 868, w: 536, h: 256, crop: [887, 425, 196, 54], view: "settings", zh: "分段控件", cls: ".segs" },
  { id: "nav", page: "A", x: 70, y: 1208, w: 380, h: 476, crop: [0, 46, 212, 260], view: "agents", zh: "侧边导航", cls: "#nav" },
  { id: "size", page: "A", x: 474, y: 1208, w: 536, h: 200, crop: [873, 214, 204, 38], view: "settings", zh: "", cls: "" },
  { id: "look", page: "A", x: 474, y: 1484, w: 536, h: 200, crop: [904, 60, 175, 40], view: "settings", zh: "主题切换", cls: ".segs" },
  { id: "pick", page: "B", x: 70, y: 684, w: 940, h: 560, crop: [588, 82, 510, 324], view: "agents", zh: "下拉选择器", cls: "BUI.picker()" },
  { id: "menu", page: "B", x: 70, y: 1328, w: 380, h: 360, crop: [222, 82, 214, 226], view: "agents", zh: "行菜单", cls: "BUI.menu()" },
  { id: "dlg", page: "B", x: 474, y: 1328, w: 536, h: 360, crop: [324, 316, 452, 186], view: "agents", zh: "确认对话框", cls: "BUI.confirm()" },
];
const PAGE = { A: [6.3, 11.2], B: [11.3, 15.9] };
const cardsEl = $("#cards");
for (const c of CARDS) {
  c.el = document.createElement("div"); c.el.className = "card";
  Object.assign(c.el.style, { left: c.x + "px", top: c.y + "px", width: c.w + "px", height: c.h + "px" });
  c.f = document.createElement("iframe"); c.f.src = "/index.html"; c.el.append(c.f);
  cardsEl.append(c.el);
  const [cx, cy, cw, ch] = c.crop, k = Math.min(c.w / cw, c.h / ch);
  c.f.style.transform = `translate(${c.w / 2 - (cx + cw / 2) * k}px, ${c.h / 2 - (cy + ch / 2) * k}px) scale(${k})`;
  if (c.zh) {
    c.lab = document.createElement("div"); c.lab.className = "clabel";
    c.lab.innerHTML = `${c.zh}<code>${c.cls}</code>`;
    c.lab.style.left = c.x + 6 + "px"; c.lab.style.top = c.y - 42 + "px";
    cardsEl.append(c.lab);
  }
}
const card = (id) => CARDS.find((c) => c.id === id);

const frames = [f1, f2, ...CARDS.map((c) => c.f)];
const docs = () => frames.map((f) => f.contentDocument).filter(Boolean);
function syncAnims(doc, t) {
  for (const a of doc.getAnimations()) {
    if (a.__born === undefined) a.__born = t;
    const el = (t - a.__born) * 1000, end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
    if (end !== Infinity && el >= end) { if (a.playState !== "finished") try { a.finish(); } catch {} }
    else { a.pause(); a.currentTime = el; }
  }
}
function find(doc, target) {
  if (target.text) return [...doc.querySelectorAll(target.within + " *")].find((n) => n.children.length === 0 && n.textContent.trim() === target.text)?.closest(target.up || "*");
  return doc.querySelector(target.sel);
}
const run = (f, fn) => { try { fn(f.contentWindow, f.contentDocument); } catch (e) { console.error(e); } };
const press = (target) => (w, d) => { const el = find(d, target); if (el) { el.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true })); el.click(); } else console.warn("miss " + JSON.stringify(target)); };

// ---------- cursor keyframes (main window only): arrive at t; click fires on arrival ----------
const C = [
  { t: 20.7, xy: [900, 1640] },
  { t: 21.4, sel: '#nav button[data-view="routing"]', click: true },
  { t: 22.1, xy: [880, 1640] },
  { t: 30.4, xy: [880, 1480] },
  { t: 31.2, sel: "#prefs", click: true },
  { t: 31.9, sel: "#setTabs button:nth-of-type(2)", click: true },
  { t: 32.6, xy: [920, 1600] },
];
const cursorOn = (t) => Math.min(seg(t, 20.5, 20.8), 1 - seg(t, 21.8, 22.1)) + Math.min(seg(t, 30.2, 30.5), 1 - seg(t, 32.3, 32.6));

// ---------- scripted actions: [time, target frames, fn] ----------
const main = [f1, f2];
const A = [
  { t: 0, on: main, fn: (w) => w.BUI.go("agents") },
  { t: 27.9, on: main, fn: (w) => w.BUI.go("agents") },
];
const cardAct = (id, t, fn) => A.push({ t, on: [card(id).f], fn, sfx: true });
cardAct("sw", 7.9, press({ sel: '#agents .row[data-id="photo"] .lib-switch' }));
cardAct("sw", 9.0, press({ sel: '#agents .row[data-id="photo"] .lib-switch' }));
cardAct("sw", 10.1, press({ sel: '#agents .row[data-id="photo"] .lib-switch' }));
cardAct("segs", 8.2, press({ sel: "#keepAwakeSegs button:nth-of-type(2)" }));
cardAct("segs", 9.35, press({ sel: "#keepAwakeSegs button:nth-of-type(3)" }));
cardAct("segs", 10.5, press({ sel: "#keepAwakeSegs button:nth-of-type(1)" }));
cardAct("nav", 8.5, press({ sel: '#nav button[data-view="providers"]' }));
cardAct("nav", 9.6, press({ sel: '#nav button[data-view="usage"]' }));
cardAct("nav", 10.7, press({ sel: '#nav button[data-view="routing"]' }));
cardAct("size", 8.8, press({ sel: "#textSizeSegs button:nth-of-type(3)" }));
cardAct("size", 10.3, press({ sel: "#textSizeSegs button:nth-of-type(2)" }));
cardAct("look", 9.15, press({ sel: "#view-settings .row.pref .segs button:nth-of-type(2)" }));
cardAct("row", 9.8, press({ sel: '#agents .row[data-id="photo"] .lib-switch' }));
cardAct("pick", 12.4, press({ sel: '#agents .row[data-id="photo"] .field' }));
cardAct("pick", 14.0, press({ text: "NAS 备份盘", within: "#pop", up: "li, [role=option], button" }));
cardAct("menu", 12.75, press({ sel: '#agents .row[data-id="photo"] .ag-handle' }));
cardAct("dlg", 13.1, (w) => { w.BUI.confirm("删除存储「对象存储」？", "使用它的服务会改存到 NAS 主盘，文件不会丢失。", "删除"); });
for (const k of C) if (k.click) A.push({ t: k.t + 0.04, on: main, fn: press(k), sfx: true });
A.sort((a, b) => a.t - b.t);
let done = 0;
window.SFX = A.filter((a) => a.sfx).map((a) => +a.t.toFixed(3));

// map a point inside the main iframe to stage coordinates for the current frame geometry
let G = { x: 0, y: 0, s: 1 };
const toStage = (x, y) => [G.x + x * G.s, G.y + y * G.s];
function elXY(sel, fx = 0.5, fy = 0.5) {
  const el = f1.contentDocument.querySelector(sel);
  if (!el) return [AX, AY];
  const r = el.getBoundingClientRect();
  return toStage(r.left + r.width * fx, r.top + r.height * fy);
}
const targetXY = (k) => (k.xy ? k.xy : elXY(k.sel, 0.5, 0.55));

// ---------- callouts on the assembled app ----------
const CO = [
  { t: 17.7, sel: "header.top .crumb", fx: 0.3, zh: "顶栏", cls: "header.top", at: [300, 600] },
  { t: 18.05, sel: '#agents .row[data-id="photo"] .field', zh: "选择器", cls: ".field", at: [690, 600] },
  { t: 18.4, sel: '#agents .row[data-id="photo"] .lib-switch', zh: "开关", cls: ".lib-switch", at: [915, 535] },
  { t: 18.75, sel: '#nav button[data-view="providers"]', fx: 0.3, zh: "侧边栏", cls: ".sidebar", at: [190, 1475] },
  { t: 19.1, sel: '#agents .row[data-id="note"] .who', fx: 0.2, zh: "列表行", cls: ".row", at: [470, 1475] },
  { t: 19.45, sel: ".chips", fx: 0.3, zh: "场景标签", cls: ".chips", at: [800, 1475] },
  { t: 22.1, t1: 23.15, sel: ".rt-stage", fx: 0.62, fy: 0.15, zh: "实时流向图", cls: ".rt-stage", at: [540, 600] },
];
const coEl = $("#callouts"), lines = $("#lines");
for (const c of CO) {
  c.el = document.createElement("div"); c.el.className = "co"; c.el.innerHTML = `<code>${c.cls}</code>${c.zh}`; coEl.append(c.el);
  c.ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
  c.dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.ln.setAttribute("stroke", "#2dd4bf"); c.ln.setAttribute("stroke-width", "2.5"); c.ln.setAttribute("stroke-linecap", "round");
  c.dot.setAttribute("fill", "#2dd4bf"); c.dot.setAttribute("stroke", "#08080a"); c.dot.setAttribute("stroke-width", "3");
  lines.append(c.ln, c.dot);
}

// ---------- code card ----------
const CODE = [["p", "<"], ["t", "script"], ["x", " "], ["a", "src"], ["p", "="], ["s", '"https://cdn.jsdelivr.net/gh/buer5/better-ui@main/better-ui.js"'], ["p", "></"], ["t", "script"], ["p", ">"]];
const codeChars = [];
{
  const pre = $("#codeText");
  for (const [k, s] of CODE) for (const ch of s) { const sp = document.createElement("span"); sp.className = "tk-" + k; sp.textContent = ch; pre.append(sp); codeChars.push(sp); }
  const caret = document.createElement("span"); caret.id = "caret"; pre.append(caret);
}

function render(t) {
  while (done < A.length && A[done].t <= t) { const a = A[done++]; a.on.forEach((f) => run(f, a.fn)); }

  // background
  const g1 = $("#g1"), g2 = $("#g2");
  g1.style.transform = `translate(${-260 + Math.sin(t * 0.21) * 120}px, ${-180 + Math.cos(t * 0.17) * 140 + track(t, [[0, 600], [6, 0], [36.5, 0], [38.5, 520]])}px)`;
  g2.style.transform = `translate(${480 + Math.cos(t * 0.19) * 140}px, ${1250 + Math.sin(t * 0.23) * 120}px)`;
  g1.style.opacity = (0.32 * (0.6 + 0.4 * seg(t, 0, 3))).toFixed(3);
  $("#grid").style.opacity = track(t, [[0, 0], [2.9, 0], [4.5, 1], [36.3, 1], [37.1, 0.4]]);
  const n = Math.floor(t * 30);
  $("#grain").style.transform = `translate(${((n * 73) % 200) - 100}px, ${((n * 131) % 200) - 100}px)`;
  $("#fade").style.opacity = Math.max(1 - seg(t, 0, 0.8, E.out), seg(t, DUR - 0.7, DUR, E.lin)).toFixed(3);

  // S1, S2
  text("s1a", t, 0.3, 2.55, { st: 0.07, d: 0.85, bl: 16 });
  text("s1b", t, 0.95, 2.55, { st: 0.06, d: 0.85, bl: 16 });
  text("s1c", t, 1.6, 2.55, { st: 0.02, d: 0.7 });
  text("s2a", t, 3.0, 5.85, { st: 0.06, d: 1.0, bl: 24, y: 0.25 });
  text("s2b", t, 3.75, 5.85, { st: 0.03 });
  text("s2c", t, 4.25, 5.85, { st: 0.025 });

  // scene titles
  const S = [[6.35, 10.95], [11.35, 15.7], [16.15, 23.1], [23.6, 27.6], [28.1, 32.2], [32.7, 36.3]];
  S.forEach(([a, b], i) => {
    text("k" + (i + 1), t, a, b, { st: 0.04, d: 0.6, bl: 6 });
    text("t" + (i + 1), t, a + 0.15, b, { st: 0.035, d: 0.75 });
    if (blocks["m" + (i + 1)]) text("m" + (i + 1), t, a + 0.9, b, { st: 0.012, d: 0.6, bl: 4 });
  });

  // component cards
  for (const [i, c] of CARDS.entries()) {
    const [a, b] = PAGE[c.page], j = CARDS.filter((x) => x.page === c.page).indexOf(c);
    const p = seg(t, a + 0.3 + j * 0.12, a + 1.1 + j * 0.12, E.quint), q = seg(t, b - 0.05 + j * 0.03, b + 0.45 + j * 0.03, E.io);
    const vis = p > 0 && q < 1;
    c.el.style.display = vis ? "" : "none";
    if (c.lab) c.lab.style.display = vis ? "" : "none";
    if (!vis) continue;
    const op = p * (1 - q);
    c.el.style.opacity = op.toFixed(3);
    c.el.style.transform = `translateY(${(1 - p) * 70 - q * 30}px) scale(${0.94 + 0.06 * p - 0.04 * q})`;
    c.el.style.filter = (1 - p) * 12 + q * 10 > 0.1 ? `blur(${((1 - p) * 12 + q * 10).toFixed(2)}px)` : "none";
    if (c.lab) { const lp = seg(t, a + 0.5 + j * 0.12, a + 1.2 + j * 0.12, E.quint); c.lab.style.opacity = (lp * (1 - q)).toFixed(3); c.lab.style.transform = `translateY(${(1 - lp) * 16}px)`; }
  }

  // main window geometry
  const W = track(t, [[0, W0], [28.8, W0], [30.2, 740, E.io], [33, 740]]);
  // camera: [time, scale, focusX (in 1100-wide page px), focusY]
  const CAM = [[16.2, 0.8, 550, 410], [17.6, 0.9, 550, 410, E.expo], [21.6, 0.92, 550, 410, E.lin], [22.6, 1.25, 640, 250], [23.2, 1.27, 640, 250, E.lin], [23.7, 0.92, 550, 410],
    [25.8, 0.92, 550, 410], [26.9, 1.3, 640, 250], [27.6, 1.33, 640, 250, E.lin], [28.1, 0.9, 550, 410], [28.8, 0.9, 550, 410], [30.2, 1.15, 550, 410], [32.5, 1.18, 550, 410, E.lin]];
  const s = track(t, CAM.map((k) => [k[0], k[1], k[4]]));
  const fx = track(t, CAM.map((k) => [k[0], k[2], k[4]])) * (W / W0);
  const fy = track(t, CAM.map((k) => [k[0], k[3], k[4]]));
  const rot = track(t, [[16.2, 30], [17.6, 0, E.expo], [32.5, 0], [33.2, -16, E.io]]);
  const dy = track(t, [[16.2, 320], [17.6, 0, E.expo], [32.5, 0], [33.2, -60, E.io]]);
  const wo = Math.min(seg(t, 16.2, 16.9, E.out), 1 - seg(t, 32.55, 33.1));
  [f1, f2].forEach((f) => { f.style.width = W + "px"; f.style.height = H + "px"; });
  frame.style.width = W + "px"; frame.style.height = H + "px";
  G = { x: AX - fx * s, y: AY - fy * s + dy, s };
  $("#win").style.display = wo > 0.001 ? "" : "none";
  frame.style.opacity = wo.toFixed(3);
  frame.style.transformOrigin = "0 0";
  frame.style.transform = `translate(${AX - fx}px, ${AY - fy + dy}px) translate(${fx}px, ${fy}px) rotateX(${rot}deg) scale(${s}) translate(${-fx}px, ${-fy}px)`;
  frame.style.background = t > 25 ? "#1a1a1d" : "#fff";
  const dk = seg(t, 25.0, 26.0);
  frame.style.boxShadow = `0 0 0 1px rgba(255,255,255,${0.10 + 0.08 * dk}), 0 80px 160px -30px rgba(0,0,0,.85), 0 30px 60px -20px rgba(0,0,0,.6), 0 0 120px -20px rgba(45,212,191,${0.18 * dk})`;
  const refl = $("#refl");
  refl.style.top = G.y + H * s - 40 + "px";
  refl.style.opacity = (wo * 0.9).toFixed(3);
  const sh = Math.max(seg(t, 16.8, 17.9, E.io) * (t < 17.95), seg(t, 24.5, 25.7, E.io) * (t > 24.4 && t < 25.75));
  $("#sheen").style.transform = `translateX(${lerp(-120, 120, sh)}%)`;
  $("#sheen").style.opacity = sh > 0 && sh < 1 ? 1 : 0;

  // dark reveal: circle from the top-right corner
  const r = track(t, [[24.5, 0], [25.8, 1500, E.io]]);
  f2.style.clipPath = `circle(${r}px at ${W - 60}px 30px)`;
  f2.style.visibility = r > 0 ? "visible" : "hidden";

  for (const d of docs()) syncAnims(d, t);

  // callouts: pill + leader line + dot on the component
  for (const c of CO) {
    const t1 = c.t1 ?? 20.6;
    const p = seg(t, c.t, c.t + 0.5, E.quint), q = seg(t, t1, t1 + 0.35);
    const vis = p > 0 && q < 1 && wo > 0;
    c.el.style.display = vis ? "" : "none";
    c.ln.style.display = c.dot.style.display = vis ? "" : "none";
    if (!vis) continue;
    const [ex, ey] = elXY(c.sel, c.fx ?? 0.5, c.fy ?? 0.5), [px, py] = c.at;
    const op = p * (1 - q);
    c.el.style.left = px + "px"; c.el.style.top = py + (1 - p) * (py < AY ? -20 : 20) + "px";
    c.el.style.opacity = op.toFixed(3);
    const lp = seg(t, c.t + 0.1, c.t + 0.6, E.io), y0 = py + (py < AY ? 26 : -26);
    c.ln.setAttribute("x1", px); c.ln.setAttribute("y1", y0);
    c.ln.setAttribute("x2", lerp(px, ex, lp)); c.ln.setAttribute("y2", lerp(y0, ey, lp));
    c.ln.style.opacity = (op * 0.85).toFixed(3);
    c.dot.setAttribute("cx", ex); c.dot.setAttribute("cy", ey); c.dot.setAttribute("r", 8 * seg(t, c.t + 0.5, c.t + 0.75, E.back));
    c.dot.style.opacity = op.toFixed(3);
  }

  // cursor
  const co = cursorOn(t);
  const cur = $("#cursor"), cring = $("#ring");
  cur.style.display = co > 0.001 ? "" : "none";
  if (co > 0.001) {
    let i = C.findIndex((k) => k.t > t);
    if (i === -1) i = C.length;
    let x, y;
    if (i === 0) [x, y] = targetXY(C[0]);
    else if (i === C.length) [x, y] = targetXY(C[C.length - 1]);
    else {
      const a = C[i - 1], b = C[i], mv = Math.min(0.75, b.t - a.t - 0.1);
      const p = E.io(clamp((t - (b.t - mv)) / mv));
      const [x0, y0] = targetXY(a), [x1, y1] = targetXY(b);
      x = lerp(x0, x1, p); y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * Math.min(60, Math.hypot(x1 - x0, y1 - y0) * 0.12);
    }
    const last = [...C].reverse().find((k) => k.click && k.t <= t);
    const since = last ? t - last.t : 9;
    const pr = since < 0.22 ? 1 - Math.sin((since / 0.22) * Math.PI) * 0.18 : 1;
    cur.style.opacity = co.toFixed(3);
    cur.style.transform = `translate(${x - 9}px, ${y - 5}px) scale(${pr})`;
    const rp = clamp(since / 0.55);
    cring.style.opacity = since < 0.55 ? ((1 - rp) * 0.9 * co).toFixed(3) : 0;
    cring.style.transform = `translate(${x}px, ${y}px) scale(${0.3 + E.out(rp) * 0.9})`;
  } else cring.style.opacity = 0;

  // code card + chips
  const cIn = seg(t, 32.95, 33.6, E.quint), cOut = seg(t, 36.25, 36.75, E.io);
  const code = $("#code");
  code.style.display = cIn > 0 && cOut < 1 ? "" : "none";
  code.style.opacity = (cIn * (1 - cOut)).toFixed(3);
  code.style.transform = `translateY(${(1 - cIn) * 80 - cOut * 40}px) scale(${0.96 + 0.04 * cIn})`;
  code.style.filter = cOut > 0 ? `blur(${cOut * 10}px)` : "none";
  const typed = Math.floor(clamp((t - 33.5) / 1.5) * codeChars.length);
  codeChars.forEach((c, j) => (c.style.display = j < typed ? "" : "none"));
  $("#caret").style.opacity = typed < codeChars.length || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0;
  for (const ch of document.querySelectorAll(".chip")) {
    const i = +ch.dataset.i, p = seg(t, 35.0 + i * 0.12, 35.6 + i * 0.12, E.back);
    ch.style.opacity = (clamp(p) * (1 - cOut)).toFixed(3);
    ch.style.transform = `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`;
  }
  $("#chips").style.display = t > 34.9 && cOut < 1 ? "" : "none";

  // end card
  const end = $("#end");
  end.style.display = t > 36.7 ? "" : "none";
  const m = seg(t, 36.85, 37.6, E.back), mark = $("#mark");
  mark.style.opacity = clamp(m * 1.5).toFixed(3);
  mark.style.transform = `translateY(${(1 - m) * 60}px) scale(${0.7 + 0.3 * m})`;
  const k = seg(t, 37.5, 37.95, E.io);
  mark.querySelector("i").style.left = lerp(6, 60, k) + "px";
  mark.querySelector(".sw").style.background = `rgb(${lerp(243, 45, k)},${lerp(241, 212, k)},${lerp(236, 191, k)})`;
  text("endWord", t, 37.2, 99, { st: 0.05, d: 0.9, bl: 18, y: 0.25 });
  text("endSub", t, 37.7, 99, { st: 0.03 });
  const u = seg(t, 38.1, 38.8, E.quint), url = $("#endUrl");
  url.style.opacity = u; url.style.transform = `translateY(${(1 - u) * 30}px)`;
  text("endMeta", t, 38.5, 99, { st: 0.03 });
}

window.DUR = DUR;
window.ready = (async () => {
  ["s1a", "s1b", "s1c", "s2a", "s2b", "s2c", "k1", "t1", "k2", "t2", "k3", "t3", "m3", "k4", "t4", "m4", "k5", "t5", "m5", "k6", "t6", "endWord", "endSub", "endMeta"].forEach(split);
  await document.fonts.ready;
  await Promise.all(frames.map((f) => new Promise((ok) => {
    const chk = () => (f.contentWindow?.BUI && f.contentDocument.readyState === "complete" ? ok() : setTimeout(chk, 50));
    chk();
  })));
  for (const f of frames) f.contentDocument.documentElement.dataset.theme = "light";
  f2.contentDocument.documentElement.dataset.theme = "dark";
  for (const c of CARDS) {
    c.f.contentWindow.BUI.go(c.view);
    c.el.style.background = getComputedStyle(c.f.contentDocument.body).backgroundColor;
  }
  [f1, f2].forEach((f) => { f.style.width = W0 + "px"; f.style.height = H + "px"; });
  await new Promise((r) => setTimeout(r, 800));
  return true;
})();
window.render = render;
