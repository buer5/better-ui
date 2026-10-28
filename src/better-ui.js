/* =============================================================================
   better-ui.js — better-ui 的交互，按原版的 DOM 与动效参数重写（无依赖）
   它只操作原版的结构与类名：#side / header.top / #nav / .view / .segs /
   .warm-tabs / .lib-switch / .agent-more / #pop / .row-menu / #modal /
   .action-confirm / #status。动效常量取自原版 app.js。

   BUI.go(view)                      换页（#view-<view>）
   BUI.layout.toggle() / set(bool)   侧边栏 ⇄ 顶部页签（≥1024px 默认侧边栏，手机永远顶部）
   BUI.picker(field, opts)           弹出选择器：opts.items / value / rail / placeholder / onPick
   BUI.menu(anchor, items)           行菜单：[{label, key, icon, onClick}, '-', …]
   BUI.modal(editorEl) / BUI.closeModal()
   BUI.confirm(title, message, action) → Promise<boolean>
   BUI.status(text, kind)            底栏状态：'' | 'ok' | 'err' | 'warn'
   事件：.segs / .warm-tabs → 'pick'(detail.index, detail.button)；.lib-switch → 'toggle'(detail.on)；
         document → 'bui:view'(detail.view)
   ============================================================================= */
(function () {
  "use strict";
  // ---- the original's motion constants (app.js) ----
  const SPRING = CSS.supports?.("animation-timing-function", "linear(0, 1)")
    ? "linear(0, 0.0203, 0.0723, 0.1448, 0.2292, 0.3188, 0.4086, 0.4951, 0.576, 0.6498, 0.7157, 0.7735, 0.8232, 0.8654, 0.9005, 0.9293, 0.9525, 0.9708, 0.9849, 0.9956, 1.0033, 1.0087, 1.0122, 1.0142, 1.015, 1.0151, 1.0146, 1.0136, 1.0124, 1.0111, 1.0097, 1.0084, 1.0071, 1.0059, 1.0049, 1.0039, 1.0031, 1.0024, 1.0018, 1.0013, 1)"
    : "cubic-bezier(.2, .9, .25, 1.02)";
  const IOS_EASE = "cubic-bezier(.32, .72, 0, 1)";
  const VEIL_OFF = { backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px) saturate(1)", webkitBackdropFilter: "blur(0px) saturate(1)" };
  const THUMB_MS = 280, THUMB_EASE = "cubic-bezier(.2, .8, .2, 1)";
  const SIDE_AT = 1024, SIDE_MIN = 168, SIDE_MAX = 360;
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* this time only */ } } };
  // the original's svg(): one stroked path in a 16 box
  const svg = (d, size = 12, stroke = 1.6) => {
    const e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    e.setAttribute("viewBox", "0 0 16 16"); e.setAttribute("width", size); e.setAttribute("height", size);
    e.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
    return e;
  };
  const CHECK = "m3.5 8.5 3 3 6-7", STAR = "m8 2 1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6z", GRID = "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z";

  // ---- thumbs: the white shape under a strip's picked option (app.js slide) ----
  function slide(box, glide = true) {
    let th = box.querySelector(":scope > .thumb");
    if (!th) { th = el("span", "thumb"); box.prepend(th); }
    const on = box.querySelector(":scope > .on");
    if (!on || !on.offsetParent || !on.offsetWidth) { th.style.opacity = on ? "" : "0"; return; }
    th.style.opacity = "";
    const to = { transform: `translateX(${on.offsetLeft}px)`, width: on.offsetWidth + "px" };
    const from = th.style.width ? { transform: th.style.transform, width: th.style.width } : null;
    for (const a of th.getAnimations()) a.cancel();
    Object.assign(th.style, to);
    if (glide && from && !calm() && (from.transform !== to.transform || from.width !== to.width)) th.animate([from, to], { duration: THUMB_MS, easing: THUMB_EASE });
  }
  const slideAll = () => $$(".segs, #nav").forEach((b) => { if (b.matches("#nav") && document.body.classList.contains("side-nav")) return; slide(b, false); });
  new ResizeObserver(() => slideAll()).observe(document.documentElement);
  document.fonts?.ready.then(slideAll);

  // ---- strips of options: .segs (thumb) and .warm-tabs ----
  document.addEventListener("click", (e) => {
    const opt = e.target.closest(".segs > .opt, .warm-tabs > button");
    if (!opt || opt.disabled) return;
    const box = opt.parentElement;
    const i = $$(":scope > button", box).indexOf(opt);
    if (opt.classList.contains("on")) return;
    for (const o of $$(":scope > button", box)) {
      const on = o === opt;
      o.classList.toggle("on", on);
      if (box.classList.contains("warm-tabs")) { o.setAttribute("aria-selected", String(on)); o.tabIndex = on ? 0 : -1; }
      else o.setAttribute("aria-pressed", String(on));
    }
    if (box.classList.contains("segs")) slide(box);
    box.dispatchEvent(new CustomEvent("pick", { bubbles: true, detail: { index: i, button: opt } }));
  });

  // ---- switches (.lib-switch) ----
  document.addEventListener("click", (e) => {
    const s = e.target.closest(".lib-switch");
    if (!s || s.disabled) return;
    const on = !s.classList.contains("on");
    s.classList.toggle("on", on);
    s.setAttribute("aria-checked", String(on));
    s.dispatchEvent(new CustomEvent("toggle", { bubbles: true, detail: { on } }));
  });

  // ---- the folded rows at a list's foot (.agent-more / .agent-fold) ----
  document.addEventListener("click", (e) => {
    const more = e.target.closest(".agent-more");
    if (!more) return;
    const fold = more.closest(".view")?.querySelector(".agent-fold");
    if (!fold) return;
    const inner = fold.querySelector(".agent-fold-inner"), open = !fold.classList.contains("open");
    const label = more.querySelector("span");
    if (!more.dataset.closed) more.dataset.closed = label.textContent;
    fold.classList.add("moving");
    fold.classList.toggle("open", open);
    if (inner) inner.inert = !open;
    label.textContent = open ? "收起" : more.dataset.closed;
    more.setAttribute("aria-expanded", String(open));
    if (!calm()) label.animate([{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22, 1, .36, 1)" });
    const settled = () => fold.classList.remove("moving");
    fold.addEventListener("transitionend", (ev) => { if (ev.target === fold) settled(); }, { once: true });
    setTimeout(settled, 900);
  });

  // ---- status: the footer's line; over an open dialog it floats as a pill ----
  function status(msg, kind = "", ms = kind === "err" ? 8000 : 3500) {
    const s = $("#status"); if (!s) return;
    s.textContent = msg; s.title = msg;
    s.className = "status " + kind;
    s.setAttribute("role", kind === "err" ? "alert" : "status");
    const m = $("#modal");
    s.classList.toggle("lift", !!msg && m && !m.hidden && !m.classList.contains("out"));
    clearTimeout(status.t);
    if (msg) status.t = setTimeout(() => { s.textContent = ""; s.className = "status"; }, ms);
  }

  // ---- popovers: the picker (#pop) and a row's menu (.pop.row-menu) ----
  let openPop = null;
  function placePop(pop, anchor, w) {
    const r = anchor.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    if (w) pop.style.width = w + "px";
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const left = Math.round(Math.max(8, Math.min(r.left + r.width / 2 - pw / 2, vw - pw - 8)));
    pop.style.left = left + "px";
    pop.style.setProperty("--ox", Math.round(r.left + r.width / 2 - left) + "px");
    const below = vh - r.bottom - 8, up = below < Math.min(ph, 240) && r.top > below;
    pop.classList.toggle("up", up);
    if (up) { pop.style.top = "auto"; pop.style.bottom = (vh - r.top + 6) + "px"; }
    else { pop.style.bottom = "auto"; pop.style.top = (r.bottom + 6) + "px"; }
  }
  function closePop() {
    const c = openPop; if (!c) return;
    openPop = null;
    c.anchor?.classList.remove("open");
    c.anchor?.setAttribute?.("aria-expanded", "false");
    document.removeEventListener("pointerdown", c.away, true);
    document.removeEventListener("keydown", c.keys, true);
    const pop = c.pop;
    railTipOff?.();
    if (calm()) { c.done(); return; }
    pop.classList.add("leaving");
    setTimeout(() => { pop.classList.remove("leaving"); c.done(); }, 220);
  }
  function watchPop(pop, anchor, keys, done) {
    closePop();
    const c = { pop, anchor, done };
    c.away = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) closePop(); };
    c.keys = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePop(); anchor.focus?.({ preventScroll: true }); } else keys?.(e); };
    setTimeout(() => document.addEventListener("pointerdown", c.away, true));
    document.addEventListener("keydown", c.keys, true);
    openPop = c;
  }
  // items: [{ group, icon? } | { value, label, note?, icon?, reset? }]; icon is the .ic's inner HTML
  function picker(anchor, o = {}) {
    const pop = $("#pop");
    if (openPop?.anchor === anchor) { closePop(); return; }
    const list = $("#list", pop), q = $("#q", pop), rail = $("#pickerRail", pop);
    const favs = o.favorites || null;
    let groupOn = "all", sel = 0, shown = [];
    q.value = ""; q.placeholder = o.placeholder || "筛选…";
    pop.classList.toggle("model-picker", !!o.rail);
    rail.hidden = !o.rail;
    if (o.rail) {
      rail.replaceChildren(el("span", "rail-thumb"));
      const item = (g, inner, label) => { const b = el("button", "rail-item" + (g === "all" ? " on" : "")); b.dataset.group = g; b.setAttribute("aria-label", label); b.onpointerenter = () => railTip(b); b.onpointerleave = railTipOff; if (typeof inner === "string") b.innerHTML = inner; else b.append(inner); rail.append(b); };
      item("all", svg(GRID, 15, 1.4), "全部");
      if (favs) item("favorites", svg(STAR, 16, 1.4), "收藏");
      rail.append(el("span", "rail-sep"));
      for (const g of o.items.filter((x) => x.group)) item(g.group, `<span class="ic">${g.icon || ""}</span>`, g.group);
      rail.onclick = (e) => { const b = e.target.closest(".rail-item"); if (!b) return; groupOn = b.dataset.group; $$(".rail-item", rail).forEach((x) => x.classList.toggle("on", x === b)); railThumb(); draw(); list.scrollTop = 0; };
    }
    function railThumb() {
      const on = $(".rail-item.on", rail), th = $(".rail-thumb", rail); if (!on || !th) return;
      th.style.opacity = "1"; th.style.transform = `translate3d(0px, ${on.offsetTop}px, 0px)`;
    }
    function draw() {
      const f = q.value.trim().toLowerCase(); shown = []; list.replaceChildren();
      let group = null, head = null;
      for (const it of o.items) {
        if (it.group) { group = it.group; head = it.group; continue; }
        if (f && !(it.label + " " + (it.note || "") + " " + (group || "")).toLowerCase().includes(f)) continue;
        if (groupOn === "favorites" && !favs?.has(it.value)) continue;
        if (groupOn !== "all" && groupOn !== "favorites" && group !== groupOn && !it.reset) continue;
        if (head && !it.reset && groupOn === "all" && !f) { list.append(el("li", "group", head)); head = null; }
        const li = el("li", (it.value === o.value ? "cur" : "") + (it.reset ? " reset" : ""));
        li.dataset.i = shown.length;
        const ic = el("span", "ic" + (it.icon ? "" : " blank")); if (it.icon) ic.innerHTML = it.icon;
        const words = el("span", "option-words");
        words.append(el("span", "v", it.label));
        if (it.note) { const n = el("span", "n", it.note); n.title = it.note; words.append(n); }
        li.append(ic, words);
        if (favs && !it.reset) {
          const fb = el("button", "favorite" + (favs.has(it.value) ? " on" : ""));
          fb.type = "button"; fb.title = favs.has(it.value) ? "从收藏中移除" : "添加到收藏"; fb.setAttribute("aria-pressed", String(favs.has(it.value)));
          fb.append(svg(STAR, 14, 1.4)); li.append(fb);
        }
        const ck = el("span", "check"); ck.append(svg(CHECK, 12, 1.8)); li.append(ck);
        list.append(li); shown.push(it);
      }
      if (!shown.length) list.append(el("li", "group", "没有匹配项"));
      sel = Math.max(0, shown.findIndex((x) => x.value === o.value)); if (f) sel = 0;
      mark();
    }
    function mark(scroll) { for (const li of $$("li[data-i]", list)) { li.classList.toggle("sel", +li.dataset.i === sel); if (scroll && +li.dataset.i === sel) li.scrollIntoView({ block: "nearest" }); } }
    function pick(i) { const it = shown[i]; if (!it) return; closePop(); o.onPick?.(it); }
    list.onpointermove = (e) => { const li = e.target.closest("li[data-i]"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; mark(); } };
    list.onclick = (e) => {
      const li = e.target.closest("li[data-i]"); if (!li) return;
      const fb = e.target.closest(".favorite");
      if (fb) { const it = shown[+li.dataset.i]; favs.has(it.value) ? favs.delete(it.value) : favs.add(it.value); fb.classList.toggle("on", favs.has(it.value)); fb.setAttribute("aria-pressed", String(favs.has(it.value))); return; }
      pick(+li.dataset.i);
    };
    q.oninput = draw;
    draw();
    pop.hidden = false;
    anchor.classList.add("open");
    placePop(pop, anchor, o.rail ? 490 : 372);
    if (o.rail) requestAnimationFrame(railThumb);
    mark(true);
    q.focus({ preventScroll: true });
    watchPop(pop, anchor, (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); mark(true); }
      else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
    }, () => { pop.hidden = true; });
  }
  // a rail icon's name beside it (app.js showRailTip): the first waits a moment, the next comes at once
  let tip = null, tipT = 0, tipAt = 0;
  function railTip(b) {
    clearTimeout(tipT);
    const warm = tip?.classList.contains("on") || performance.now() - tipAt < 400;
    const show = () => {
      if (!b.isConnected) return;
      if (!tip) { tip = el("div", "rail-tip"); tip.setAttribute("role", "tooltip"); document.body.append(tip); }
      tip.textContent = b.getAttribute("aria-label");
      const r = b.getBoundingClientRect(), w = tip.offsetWidth, right = r.right + 8 + w <= innerWidth - 4;
      tip.style.left = (right ? r.right + 8 : Math.max(4, r.left - 8 - w)) + "px";
      tip.style.top = r.top + r.height / 2 + "px";
      tip.classList.toggle("left", !right); tip.classList.add("on");
      tipAt = performance.now();
    };
    if (warm) show(); else tipT = setTimeout(show, 450);
  }
  function railTipOff() { clearTimeout(tipT); if (tip?.classList.contains("on")) { tip.classList.remove("on"); tipAt = performance.now(); } }
  function menu(anchor, items) {
    if (openPop?.anchor === anchor) { closePop(); return; }
    const m = el("div", "pop row-menu"); m.setAttribute("role", "menu");
    for (const it of items) {
      if (it === "-") { m.append(el("div", "rm-sep")); continue; }
      const b = el("button", "rm-item"); b.type = "button"; b.setAttribute("role", "menuitem");
      if (it.icon) b.append(svg(it.icon, 13, 1.5));
      b.append(el("span", "rm-name", it.label));
      if (it.key) b.append(el("span", "rm-key", it.key));
      if (it.title) b.title = it.title;
      b.onclick = () => { closePop(); it.onClick?.(); };
      m.append(b);
    }
    document.body.append(m);
    const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: anchor.x, bottom: anchor.y, top: anchor.y };
    const left = Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8));
    let top = r.bottom + 4; if (top + m.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - m.offsetHeight - 4);
    m.style.left = left + "px"; m.style.top = top + "px";
    anchor.classList?.add("open"); anchor.setAttribute?.("aria-expanded", "true");
    const btns = () => $$(".rm-item", m);
    btns()[0]?.focus({ preventScroll: true });
    watchPop(m, anchor.getBoundingClientRect ? anchor : document.body, (e) => {
      const l = btns(), i = l.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (l[i + 1] || l[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (l[i - 1] || l.at(-1)).focus(); }
    }, () => m.remove());
  }

  // ---- the dialog (#modal > .dialog), as app.js openModal / closeModal draw it ----
  let returnFocus = null, modalDone = null;
  function framed(ed) {
    if (!ed.matches(".editor") || ed.querySelector(":scope > .ebody")) return;
    const body = el("div", "ebody");
    body.append(...[...ed.children].filter((c) => !c.matches(".ehead, .bar")));
    ed.querySelector(":scope > .bar") ? ed.querySelector(":scope > .bar").before(body) : ed.append(body);
    ed.classList.add("framed");
  }
  function modal(content) {
    const m = $("#modal"), d = m.firstElementChild;
    const fresh = m.hidden || m.classList.contains("out");
    m.classList.remove("out");
    framed(content);
    if (fresh) returnFocus = document.activeElement;
    d.replaceChildren(content);
    d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.tabIndex = -1;
    const title = content.querySelector(".ehead b, h2, h3");
    if (title) { title.id = "modalTitle"; d.setAttribute("aria-labelledby", "modalTitle"); }
    m.hidden = false;
    for (const e of [...document.body.children]) if (e !== m && e.id !== "pop" && e.tagName !== "SCRIPT" && e.tagName !== "TEMPLATE") e.inert = true;
    (content.querySelector("input:not([disabled]), textarea, select") || content.querySelector("button:not([disabled])") || d).focus({ preventScroll: true });
    if (!fresh) return;
    // held where it opened: centred, then kept there as it grows
    m.classList.remove("held"); d.style.top = d.style.maxHeight = "";
    const off = d.offsetTop - parseFloat(getComputedStyle(m).paddingTop);
    m.classList.add("held"); d.style.top = off + "px"; d.style.maxHeight = "100%";
    for (const a of [...m.getAnimations(), ...d.getAnimations()]) a.cancel();
    m.animate([{ ...VEIL_OFF, offset: 0 }], { duration: 280, easing: "ease-out" });
    if (calm()) { d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
    d.animate([{ transform: "translateY(24px) scale(.94)" }, { transform: "none" }], { duration: 570, easing: SPRING });
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
  }
  function closeModal() {
    const m = $("#modal"), d = m.firstElementChild;
    if (m.hidden) return Promise.resolve();
    if (m.classList.contains("out")) return modalDone || Promise.resolve();
    m.classList.add("out");
    for (const e of [...document.body.children]) e.inert = false;
    for (const a of [...m.getAnimations(), ...d.getAnimations()]) a.commitStyles?.(), a.cancel();
    const shape = { duration: 260, easing: IOS_EASE, fill: "forwards" };
    const moves = [m.animate([VEIL_OFF], { ...shape, easing: "ease-out" }),
      calm() ? d.animate([{ opacity: 0 }], { duration: 140, fill: "forwards" }) : d.animate([{ transform: "translateY(14px) scale(.95)" }], shape)];
    if (!calm()) moves.push(d.animate([{ offset: .2, opacity: getComputedStyle(d).opacity, easing: "ease-in" }, { opacity: 0 }], { ...shape, easing: "linear" }));
    const done = modalDone = Promise.all(moves.map((a) => a.finished)).then(() => {
      if (modalDone !== done) return;
      modalDone = null;
      m.hidden = true; m.classList.remove("held", "out");
      d.style.top = d.style.maxHeight = "";
      d.replaceChildren();
      for (const a of [...m.getAnimations(), ...d.getAnimations()]) a.cancel();
      d.style.opacity = d.style.transform = "";
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    });
    return done;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const m = $("#modal"); if (!m) return;
    m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(); });
    m.addEventListener("keydown", (e) => { if (e.key === "Escape" && !openPop) { e.preventDefault(); closeModal(); } });
  });
  // a question before an action that can't be taken back (app.js's action-confirm)
  function confirm(title, message, action) {
    const dialog = el("dialog", "action-confirm");
    dialog.setAttribute("role", "alertdialog");
    const heading = el("h2", "", title), description = el("p", "", message), bar = el("div", "bar");
    const cancel = el("button", "text", "取消"), accept = el("button", "text primary danger-fill", action);
    cancel.type = accept.type = "button";
    bar.append(el("span", "grow"), cancel, accept);
    dialog.append(heading, description, bar);
    const prev = document.activeElement;
    document.body.append(dialog);
    return new Promise((resolve) => {
      const finish = (ok) => { dialog.close(); dialog.remove(); prev?.focus?.({ preventScroll: true }); resolve(ok); };
      cancel.onclick = () => finish(false);
      accept.onclick = () => finish(true);
      dialog.addEventListener("cancel", (e) => { e.preventDefault(); finish(false); });
      dialog.addEventListener("click", (e) => { const r = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) finish(false); });
      dialog.showModal();
      cancel.focus();
    });
  }

  // ---- layout the original computes in script, by the room a box has ----
  // byWidth (routing/client.js): a box's own width as a class, as container queries would
  function byWidth(node, marks) {
    if (!node) return;
    new ResizeObserver(([e]) => { const w = e.contentRect.width; requestAnimationFrame(() => { for (const [c, fits] of Object.entries(marks)) node.classList.toggle(c, fits(w)); }); }).observe(node);
  }
  // the routing stage's wires (routing/client.js layout, curve): from each agent to the hub, from the hub to each row
  function curve(x0, y0, mx, x3, y3) {
    let a = [x0, y0], b = [mx, y0], c = [mx, y3];
    const d = [x3, y3], lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    let s = `M${x0} ${y0}`;
    for (let n = Math.min(64, Math.ceil(Math.abs(y3 - y0) / 1000)); n > 1; n--) {
      const t = 1 / n, ab = lerp(a, b, t), bc = lerp(b, c, t), cd = lerp(c, d, t), abc = lerp(ab, bc, t), bcd = lerp(bc, cd, t), m = lerp(abc, bcd, t);
      s += ` C${ab[0]} ${ab[1]} ${abc[0]} ${abc[1]} ${m[0]} ${m[1]}`;
      a = m; b = bcd; c = cd;
    }
    return s + ` C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${x3} ${y3}`;
  }
  function stageWires(stage) {
    const r = stage.getBoundingClientRect(); if (!r.width) return;
    const svgEl = $(":scope > .rt-wires", stage), hub = $(".rt-hub", stage), srcs = $(".rt-srcs", stage), list = $(".rt-accts", stage);
    if (!svgEl || !hub || !srcs || !list) return;
    const b = (e) => { const x = e.getBoundingClientRect(); return { l: x.left - r.left, r: x.right - r.left, t: x.top - r.top, b: x.bottom - r.top, cx: (x.left + x.right) / 2 - r.left, cy: (x.top + x.bottom) / 2 - r.top }; };
    const h = b(hub), low = b(srcs).b, ds = [];
    for (const n of srcs.children) { const s = b(n), mx = (s.r + h.l) / 2; ds.push(h.l > s.r ? curve(s.r, s.cy, mx, h.l, h.cy) : `M${s.cx} ${s.b} L${h.cx} ${h.t}`); }
    for (const li of list.children) {
      const a = b(li);
      if (a.l > h.r) { const mx = (h.r + a.l) / 2; ds.push(curve(h.r, h.cy, mx, a.l, a.cy)); continue; }
      const x = a.l - 12, y = Math.max(h.b, low - 8);
      ds.push(`M${h.cx} ${h.b} L${h.cx} ${y} C${h.cx} ${y + 22} ${x} ${y + 2} ${x} ${y + 24} L${x} ${a.cy - 10} Q${x} ${a.cy} ${a.l} ${a.cy}`);
    }
    svgEl.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    for (const f of $$(":scope > .rt-flows, :scope > .rt-sky", stage)) f.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    $$(":scope > path", svgEl).forEach((p, i) => { if (ds[i] && p.getAttribute("d") !== ds[i]) p.setAttribute("d", ds[i]); });
  }
  // a request's numbers under where it went, once they no longer fit beside it (routing/client.js metaFit)
  function metaFit(col) {
    const reqs = $(".rt-reqs", col); if (!reqs || col.classList.contains("max760") || !reqs.offsetParent) return;
    col.classList.remove("meta-under");
    const wraps = $$(".rt-req .meta:not([hidden])", reqs).some((m) => { const k = m.children; return k.length > 1 && k[k.length - 1].getBoundingClientRect().top - k[0].getBoundingClientRect().top > 2; });
    col.classList.toggle("meta-under", wraps);
  }
  // the usage cards packed into columns, each as tall as itself (app.js packUsage, fitQuota)
  const USAGE_MIN = 260, USAGE_GAP = 7;
  function fitQuota(g) {
    const wide = (e) => [...e.children].reduce((w, c) => w + c.getBoundingClientRect().width, 0) + 4 * (e.children.length - 1);
    const wraps = $$(".quota-labels", g).some((l) => { const [name, n] = l.children; return n && name.getBoundingClientRect().width + 6 + wide(n) > l.clientWidth; });
    g.classList.toggle("stacked", wraps);
  }
  function packUsage(list) {
    const cards = [...list.children], width = list.clientWidth;
    if (!width || !cards.length) { list.classList.remove("packed"); list.style.gridTemplateColumns = ""; for (const c of cards) { c.style.gridArea = ""; c.style.minHeight = ""; } list._packed = null; return; }
    const keys = cards.map((c) => c.dataset.key || "").join();
    const most = Math.max(1, Math.min(cards.length, Math.floor((width + USAGE_GAP) / (USAGE_MIN + USAGE_GAP))));
    const place = (n, hs) => {
      const ends = Array(n).fill(0), at = [];
      for (const h of hs.map(Math.ceil)) { const low = Math.min(...ends), c = ends.findIndex((e) => e <= low + 1); at.push([c, ends[c], h]); ends[c] += h + USAGE_GAP; }
      const tall = Math.max(...ends) - USAGE_GAP;
      const empty = ends.reduce((s, e) => s + tall - (e - USAGE_GAP), 0) * (width - (n - 1) * USAGE_GAP) / n;
      return { n, at, tall, empty };
    };
    const heights = () => { for (const c of cards) c.style.minHeight = ""; for (const g of $$(".quota-windows", list)) fitQuota(g); return cards.map((c) => c.getBoundingClientRect().height); };
    const columns = (n) => { list.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`; };
    let best; const was = list._packed;
    if (was && was.most === most && was.keys === keys && list.classList.contains("packed")) best = place(was.n, heights());
    else {
      list.classList.remove("packed");
      for (const c of cards) c.style.gridArea = "";
      for (let n = most; n >= Math.max(1, most - 1); n--) { columns(n); const p = place(n, heights()); if (!best) best = p; else if (p.tall <= best.tall * 1.3 && p.empty < best.empty * 0.6) best = p; }
      columns(best.n); best = place(best.n, heights());
    }
    list._packed = { most, keys, n: best.n };
    list.classList.add("packed");
    const last = new Map(best.at.map(([c], i) => [c, i]));
    best.at.forEach(([c, top, h], i) => {
      if (last.get(c) === i) h = best.tall - top;
      const area = `${top + 1} / ${c + 1} / span ${Math.max(1, h)} / span 1`;
      if (cards[i].style.gridArea !== area) cards[i].style.gridArea = area;
      const min = last.get(c) === i ? `${h}px` : "";
      if (cards[i].style.minHeight !== min) cards[i].style.minHeight = min;
    });
  }
  function fits() {
    for (const rt of $$(".rt")) byWidth(rt, { max560: (w) => w <= 560 });
    for (const l of $$(".rt-accts")) byWidth(l, { max460: (w) => w <= 460, max560: (w) => w <= 560 });
    for (const m of $$(".rt-more")) byWidth(m, { max520: (w) => w <= 520, min1150: (w) => w >= 1150 });
    for (const c of $$(".rt-col")) byWidth(c, { max440: (w) => w <= 440, max760: (w) => w <= 760 });
    for (const stage of $$(".rt-stage")) { let f = 0; new ResizeObserver(() => { if (!f) f = requestAnimationFrame(() => { f = 0; stageWires(stage); }); }).observe(stage); }
    for (const col of $$(".rt-col")) { let f = 0; new ResizeObserver(() => { if (!f) f = requestAnimationFrame(() => { f = 0; metaFit(col); }); }).observe(col); }
    for (const list of $$(".subscription-usage")) {
      let f = 0; const soon = () => { if (!f) f = requestAnimationFrame(() => { f = 0; packUsage(list); }); };
      const ro = new ResizeObserver(soon); ro.observe(list);
      for (const card of list.children) { ro.observe(card); for (const part of card.children) ro.observe(part); }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fits); else fits();

  // ---- pages and the two layouts of the navigation (app.js layoutNav) ----
  const layout = {};
  // the platform's own faces on Windows (layout.js): Segoe UI Variable and YaHei UI for Chinese
  if (/^Win/.test(navigator.platform)) document.documentElement.classList.add("win");
  function boot() {
    const side = $("#side"), top = $("header.top"), nav = $("#nav"), crumb = $("#crumb"), toggleBtn = $("#sideToggle");
    if (!side || !top || !nav) return;
    const brand = $(".brand"), prefs = $("#prefs"), actions = $(".actions", top);
    let hl = $(":scope > .nav-top-hl", nav); if (!hl) { hl = el("i", "nav-top-hl"); nav.append(hl); }
    let pick = store.get("better-ui.navLayout"), view = ($(".view:not([hidden])") || $(".view")).id.replace("view-", "");
    const wide = matchMedia(`(min-width: ${SIDE_AT}px)`), phoneQ = matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1024px)");
    // a phone's browser (web mode) has no sidebar; a desktop window keeps it at any width (app.js phoneWeb)
    const phone = { get matches() { return document.body.classList.contains("web") && phoneQ.matches; }, addEventListener: (t, f) => phoneQ.addEventListener(t, f) };
    const isSide = () => document.body.classList.contains("side-nav");
    const want = () => !phone.matches && (pick ? pick === "side" : wide.matches);
    const sw = +store.get("better-ui.sideWidth"); if (sw) document.body.style.setProperty("--side-w", sw + "px");

    const rowOf = (v) => v === "settings" ? prefs : $(`:scope > button[data-view="${v}"]`, nav);
    const groupOf = (b) => { for (let n = b?.previousElementSibling; n; n = n.previousElementSibling) if (n.classList.contains("nav-gl")) return n.textContent.trim(); return ""; };
    const tabsOf = (v) => v === "settings" ? $("#setTabs") : $(`#view-${v} .page-tabs`);
    function putHl(glide) {
      const row = rowOf(view), to = isSide() && row && row.parentElement === nav ? row : null;
      nav.classList.toggle("hl-on", !!to);
      if (!to) { hl.hidden = true; return; }
      const appearing = hl.hidden; hl.hidden = false;
      const goal = { transform: `translateY(${to.offsetTop}px)`, height: to.offsetHeight + "px" };
      const from = { transform: hl.style.transform, height: hl.style.height };
      for (const a of hl.getAnimations()) a.cancel();
      Object.assign(hl.style, goal);
      if (!glide || calm() || !from.transform) return;
      if (appearing) hl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
      else hl.animate([from, goal], { duration: 420, easing: SPRING });
    }
    function drawCrumb() {
      if (!crumb) return;
      const row = rowOf(view), tabs = tabsOf(view), sub = tabs && $(":scope > .on", tabs);
      const parts = [];
      const g = groupOf(row); if (g && view !== "settings") parts.push(el("span", "", g));
      const name = view === "settings" ? (prefs?.querySelector(".side-l")?.textContent || "设置") : row?.querySelector("span")?.textContent || "";
      parts.push(sub ? el("span", "", name) : el("b", "", name));
      if (sub) parts.push(el("b", "", sub.textContent.trim()));
      crumb.replaceChildren(...parts.flatMap((p, i) => i ? [el("i", "", "/"), p] : [p]));
    }
    function subs() {
      $$(".nav-sub").forEach((x) => x.remove());
      const row = rowOf(view), tabs = tabsOf(view);
      if (!isSide() || !row || !tabs) return;
      const box = el("div", "nav-sub"); box.setAttribute("role", "tablist"); box.dataset.view = view;
      const h = el("i", "nav-hl"); box.append(h);
      for (const [i, b] of $$(":scope > button", tabs).entries()) {
        if (b.hidden) continue;
        const s = el("button", "nav-s" + (b.classList.contains("on") ? " cur" : "")); s.type = "button"; s.setAttribute("role", "tab");
        s.setAttribute("aria-selected", String(b.classList.contains("on"))); s.tabIndex = b.classList.contains("on") ? 0 : -1;
        s.dataset.i = i; s.append(el("span", "", b.textContent.trim()));
        box.append(s);
      }
      row.after(box);
      const put = (still) => { const c = $(".nav-s.cur", box); if (!c) return; if (still) h.classList.add("still"); h.style.transform = `translateY(${c.offsetTop}px)`; h.style.height = c.offsetHeight + "px"; if (still) { void h.offsetWidth; h.classList.remove("still"); } };
      put(true);
      box.onclick = (e) => {
        const s = e.target.closest(".nav-s"); if (!s) return;
        $$(":scope > button", tabs)[+s.dataset.i].click();
        $$(".nav-s", box).forEach((x) => { const on = x === s; x.classList.toggle("cur", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
        put(false);
      };
    }
    function tools() {
      // beside the sidebar the page's own head (Settings' search) sits in the title bar, between the crumb and the icons
      const r = actions.getBoundingClientRect(), c = crumb?.getBoundingClientRect();
      const root = document.documentElement.style;
      root.setProperty("--top-h", top.offsetHeight + "px");
      root.setProperty("--tools-r", Math.max(46, Math.round(innerWidth - r.left + 8)) + "px");
      if (c) root.setProperty("--tools-l", Math.round(c.right + 16) + "px");
    }
    // a narrow window's header (app.js fitTop): the name goes first, then the tabs come closer,
    // then they leave the middle for the row, then they get smaller, and last they scroll
    function fitTop() {
      top.classList.remove("tight", "cramped", "inrow", "crowded", "packed");
      if (isSide()) return;
      const fits = () => {
        const a = actions.getBoundingClientRect();
        if (a.right > top.getBoundingClientRect().right - parseFloat(getComputedStyle(top).paddingRight) + 0.5) return false;
        const lead = toggleBtn?.offsetParent ? toggleBtn : brand;
        const left = lead.offsetParent ? lead.getBoundingClientRect().right : top.getBoundingClientRect().left + parseFloat(getComputedStyle(top).paddingLeft);
        if (!nav.offsetParent) return left + 8 <= a.left;
        const n = nav.getBoundingClientRect();
        return left + 8 <= n.left && n.right + 8 <= a.left;
      };
      for (const step of ["tight", "cramped", "inrow", "crowded", "packed"]) { if (fits()) break; top.classList.add(step); }
      slide(nav, false);
    }
    const topFit = new ResizeObserver(() => fitTop());
    for (const e of [top, brand, actions]) if (e) topFit.observe(e);
    document.fonts?.ready.then(fitTop);
    function apply(on) {
      document.body.classList.toggle("side-nav", on);
      side.hidden = !on;
      if (crumb) crumb.hidden = !on;
      if (on) {
        $(".side-top", side).append(brand);
        $(".side-scroll", side).append(nav);
        if (prefs) $(".side-foot", side).prepend(prefs);
        $(":scope > .thumb", nav)?.remove();
      } else {
        top.prepend(brand);
        (crumb || toggleBtn || brand).after(nav);
        if (prefs) actions.append(prefs);
      }
      if (toggleBtn) {
        toggleBtn.hidden = phone.matches;
        const t = on ? "隐藏侧边栏" : "显示侧边栏";
        toggleBtn.title = t; toggleBtn.setAttribute("aria-label", t); toggleBtn.setAttribute("aria-pressed", String(on));
      }
      subs(); drawCrumb();
      requestAnimationFrame(() => { fitTop(); if (!on) slide(nav, false); putHl(false); tools(); slideAll(); });
    }
    function go(v, glide = true) {
      const page = $("#view-" + v); if (!page) return;
      view = v;
      for (const p of $$(".view")) p.hidden = p !== page;
      for (const b of $$(":scope > button[data-view]", nav)) { const on = b.dataset.view === v; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); }
      prefs?.classList.toggle("on", v === "settings");
      if (!isSide()) slide(nav, glide);
      subs(); drawCrumb(); putHl(glide); tools();
      page.scrollTop = 0;
      requestAnimationFrame(slideAll);
      if (glide) try { history.replaceState(null, "", "#/" + v); } catch { /* a file: page may refuse */ }
      document.dispatchEvent(new CustomEvent("bui:view", { detail: { view: v } }));
    }
    nav.addEventListener("click", (e) => { const b = e.target.closest("button[data-view]"); if (b) go(b.dataset.view); });
    prefs?.addEventListener("click", () => go("settings"));
    document.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === ",") { e.preventDefault(); go("settings"); } });
    document.addEventListener("pick", (e) => { if (e.target === tabsOf(view)) drawCrumb(); });
    function toggle() {
      pick = isSide() ? "top" : "side";
      store.set("better-ui.navLayout", pick);
      apply(pick === "side");
    }
    toggleBtn?.addEventListener("click", toggle);
    const onMedia = () => { if (want() !== isSide()) apply(want()); else if (toggleBtn) toggleBtn.hidden = phone.matches; };
    wide.addEventListener("change", onMedia); phone.addEventListener("change", onMedia);
    addEventListener("resize", tools);
    // the sidebar's edge: dragged, it follows the pointer; well past its narrowest it folds away
    const edge = $("#sideEdge");
    edge?.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !isSide()) return;
      e.preventDefault(); edge.setPointerCapture(e.pointerId); document.body.classList.add("side-drag");
      const off = side.getBoundingClientRect().width - e.clientX; let w = 0;
      const mv = (ev) => { w = ev.clientX + off; document.body.style.setProperty("--side-w", Math.max(SIDE_MIN, Math.min(SIDE_MAX, w)) + "px"); putHl(false); };
      const up = () => {
        edge.removeEventListener("pointermove", mv); edge.removeEventListener("pointerup", up); document.body.classList.remove("side-drag");
        if (w && w < SIDE_MIN - 60) { document.body.style.removeProperty("--side-w"); toggle(); return; }
        store.set("better-ui.sideWidth", Math.round(side.getBoundingClientRect().width)); tools();
      };
      edge.addEventListener("pointermove", mv); edge.addEventListener("pointerup", up);
    });
    edge?.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const w = Math.max(SIDE_MIN, Math.min(SIDE_MAX, side.getBoundingClientRect().width + (e.key === "ArrowRight" ? 8 : -8)));
      document.body.style.setProperty("--side-w", w + "px"); store.set("better-ui.sideWidth", w); putHl(false);
    });
    Object.assign(layout, { toggle, set(on) { pick = on ? "side" : "top"; store.set("better-ui.navLayout", pick); apply(on); }, isSide, go, view: () => view });
    apply(want());
    // a page named in the address as #/page (a bare #page would scroll to an element of that id)
    const first = location.hash.replace(/^#\/?/, "");
    go($("#view-" + first) ? first : view, false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.BUI = { go: (v) => layout.go?.(v), layout, picker, menu, closePop, modal, closeModal, confirm, status, slide };
})();
