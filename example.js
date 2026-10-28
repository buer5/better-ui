// The example's own wiring: what each control does in Perch. It adds no styles of its own.
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const say = BUI.status;
  // the original's row-menu icons (16 box, one stroked path)
  const I = {
    up: "M8 12.5v-9M4 7.25l4-3.75 4 3.75",
    down: "M8 3.5v9M4 8.75l4 3.75 4-3.75",
    again: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3.25h-3.25",
    off: "M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0zM8 11v3M2 2l12 12",
    hide: "M6.6 3.7A6.9 6.9 0 0 1 8 3.5c3.75 0 6.25 4.5 6.25 4.5a11 11 0 0 1-1.5 2M4.4 4.4C2.7 5.55 1.75 8 1.75 8S4.25 12.5 8 12.5c1.2 0 2.25-.45 3.1-1.05M6.75 6.75a1.75 1.75 0 0 0 2.5 2.5M2 2l12 12",
  };
  // a storage's icon as its row in 存储 draws it
  const iconOf = (name) => {
    for (const r of $$("#providers .row.provider")) if (r.querySelector(".name")?.textContent === name) return r.querySelector(".ic")?.innerHTML || "";
    for (const t of $$("#addSheet .tile")) if (t.textContent.trim() === name) return t.querySelector(".ic")?.innerHTML || "";
    return "";
  };
  const STORES = () => [
    { group: "本机", icon: iconOf("NAS 主盘") },
    { value: "NAS 主盘", label: "NAS 主盘", note: "本机 · 8 TB · 剩 61%", icon: iconOf("NAS 主盘") },
    { value: "NAS 备份盘", label: "NAS 备份盘", note: "本机 · 8 TB · 剩 74%", icon: iconOf("NAS 备份盘") },
    { value: "NVMe 系统盘", label: "NVMe 系统盘", note: "本机 · 512 GB · 剩 38%", icon: iconOf("NVMe 系统盘") },
    { group: "远端", icon: iconOf("对象存储") },
    { value: "对象存储", label: "对象存储", note: "远端 · 按量计费", icon: iconOf("对象存储") },
    { value: "办公室 NAS", label: "办公室 NAS", note: "远端 · 经 VPN", icon: iconOf("SMB 共享") },
  ];
  const favorites = new Set(["NAS 主盘"]);

  // ---------- 服务 ----------
  const agents = $("#agents");
  agents?.addEventListener("click", (e) => {
    const row = e.target.closest(".row.agent"); if (!row) return;
    const name = row.querySelector(".name").textContent;
    const field = e.target.closest(".field");
    if (field) {
      const v = field.querySelector(".v");
      BUI.picker(field, {
        items: STORES(), value: v.textContent, rail: true, favorites, placeholder: "筛选存储…",
        onPick(it) {
          v.textContent = it.label; field.title = "数据存放在：" + it.label;
          field.classList.remove("flash"); void field.offsetWidth; field.classList.add("flash");
          say(`${name} 的数据将写入「${it.label}」`, "ok");
        },
      });
      return;
    }
    const handle = e.target.closest(".ag-handle");
    if (handle) {
      BUI.menu(handle, [
        { label: "上移", key: "Alt+↑", icon: I.up, onClick: () => { const p = row.previousElementSibling; if (p?.matches(".row.agent")) p.before(row); } },
        { label: "下移", key: "Alt+↓", icon: I.down, onClick: () => { const n = row.nextElementSibling; if (n?.matches(".row.agent")) n.after(row); } },
        "-",
        { label: "重新启动", icon: I.again, onClick: () => say(name + " 正在重新启动…") },
        { label: "停止并还原", icon: I.off, onClick: () => BUI.confirm(`停止 ${name}？`, `${name} 会停下来，已经存下的数据不会被删除。`, "停止").then((ok) => ok && say(name + " 已停止", "ok")) },
        "-",
        { label: "隐藏", icon: I.hide, onClick: () => say("示例里不会真的隐藏") },
      ]);
      return;
    }
    if (e.target.closest(".ag-link")) say(name + "：示例里没有详情页");
  });
  agents?.addEventListener("toggle", (e) => {
    const row = e.target.closest(".row.agent"), name = row.querySelector(".name").textContent;
    const st = row.querySelector(".ag-st"), t = row.querySelector(".ag-st-t");
    st.classList.toggle("on", e.detail.on);
    t.textContent = e.detail.on ? "运行中 · 刚刚启动" : "已停止";
    e.target.title = e.detail.on ? "运行中 · 关掉即停止" : "已停止 · 打开即启动";
    say(name + (e.detail.on ? " 已启动" : " 已停止"), e.detail.on ? "ok" : "");
  });
  $(".ag-manage-button")?.addEventListener("click", () => say("示例里没有批量管理"));
  $("#profiles")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    const name = chip.querySelector("span").textContent;
    const x = e.target.closest(".x");
    if (x?.textContent === "×") { BUI.confirm(`删除场景「${name}」？`, "只删除这个场景，不会改动现在的开关。", "删除").then((ok) => ok && (chip.remove(), say("已删除「" + name + "」", "ok"))); return; }
    if (x) { say("已用当前开关更新「" + name + "」", "ok"); return; }
    for (const c of $$("#profiles .chip")) c.classList.toggle("on", c === chip);
    say("已切换到「" + name + "」", "ok");
  });
  $("#save")?.addEventListener("click", () => say("已把当前开关保存为新场景", "ok"));

  // ---------- 存储 ----------
  const sheet = $("#addSheet");
  const openSheet = (on) => { sheet.hidden = !on; if (on) { const f = $(".find", sheet); f.value = ""; filter(""); f.focus(); sheet.scrollIntoView({ block: "nearest" }); } };
  const filter = (q) => {
    q = q.trim().toLowerCase();
    for (const t of $$(".tile", sheet)) t.hidden = !!q && !t.textContent.toLowerCase().includes(q);
    for (const k of $$(".kind", sheet)) { const g = k.nextElementSibling; const any = g && $$(".tile", g).some((t) => !t.hidden); k.hidden = g.hidden = !any; }
  };
  $("#addProvider")?.addEventListener("click", () => openSheet(sheet.hidden));
  $(".find", sheet)?.addEventListener("input", (e) => filter(e.target.value));
  for (const b of $$(".row-head .text", sheet)) b.addEventListener("click", () => b.textContent.includes("导入") ? editor("Acme 对象存储", iconOf("对象存储"), "导入") : openSheet(false));
  sheet?.addEventListener("click", (e) => {
    const t = e.target.closest(".tile"); if (t) editor(t.textContent.trim(), t.querySelector(".ic")?.innerHTML || "", "添加");
    if (e.target.closest(".custom")) editor("自定义存储", "", "添加");
  });
  $("#providers")?.addEventListener("click", (e) => {
    const row = e.target.closest(".row.provider"); if (!row || e.target.closest(".lib-switch, .ag-handle")) return;
    editor(row.querySelector(".name").textContent, row.querySelector(".ic")?.innerHTML || "", "保存");
  });
  $("#providers")?.addEventListener("toggle", (e) => {
    const name = e.target.closest(".row").querySelector(".name").textContent;
    say(e.detail.on ? `已启用「${name}」` : `已停用「${name}」，服务不再写入这里`, e.detail.on ? "ok" : "");
  });
  // the editor a tile opens: the original's own, its name and icon this one's
  function editor(name, ic, action) {
    const ed = $("#tplEditor").content.firstElementChild.cloneNode(true);
    const head = $(".ehead", ed);
    head.querySelector("b").textContent = name;
    if (ic) head.querySelector(".ic").innerHTML = ic;
    const primary = $(".bar .primary", ed); if (primary) primary.textContent = action;
    for (const b of $$(".bar .text", ed)) b.addEventListener("click", () => { BUI.closeModal(); if (b === primary) say(`${action === "保存" ? "已保存" : "已添加"}「${name}」`, "ok"); });
    for (const b of $$("button.text", ed)) if (b.textContent.trim() === "显示") b.addEventListener("click", () => { const k = $("input", b.parentElement) || $("input[type=password], input", ed); const show = k.type === "password"; k.type = show ? "text" : "password"; b.textContent = show ? "隐藏" : "显示"; });
    BUI.modal(ed);
  }

  // ---------- 同步 / 用量：示例数据是静止的，按钮只说一声 ----------
  for (const b of $$("#view-routing .text, #view-routing .rt-acts button")) b.addEventListener("click", () => say(b.textContent.trim() + "：示例里没有这一步"));
  $("#period")?.addEventListener("pick", (e) => say("示例里的数据不随时间范围变化"));
  $("#usageReload")?.addEventListener("click", (e) => { const b = e.currentTarget; b.classList.add("spin"); setTimeout(() => { b.classList.remove("spin"); say("已刷新", "ok"); }, 900); });

  // ---------- 设置 ----------
  const tabs = $("#setTabs"), q = $("#setQ"), none = $("#setNone"), page = $("#view-settings");
  tabs?.addEventListener("pick", (e) => {
    for (const s of $$(".set-page", page)) s.hidden = s.id !== "setPage-" + e.detail.button.dataset.set;
    page.scrollTop = 0;
  });
  q?.addEventListener("input", () => {
    const f = q.value.trim().toLowerCase();
    page.classList.toggle("set-searching", !!f);
    let any = false;
    for (const s of $$(".set-page", page)) {
      const tab = $("#" + s.getAttribute("aria-labelledby"));
      s.dataset.part = tab?.textContent.trim() || "";
      let hit = false;
      for (const r of $$(".row", s)) { const ok = !f || r.textContent.toLowerCase().includes(f); r.hidden = !ok; hit ||= ok; }
      for (const l of $$(".list", s)) l.hidden = !!f && !$$(".row", l).some((r) => !r.hidden);
      s.hidden = f ? !hit : s.id !== "setPage-" + ($(".on", tabs)?.dataset.set || "general");
      any ||= hit;
    }
    none.hidden = !f || any;
    none.textContent = f ? `没有和“${q.value.trim()}”有关的设置` : "";
  });
  const segsIn = (sel) => $(sel + " .segs");
  // the appearance strip says what the page follows now: the system, until a pick
  { const t = segsIn("#themeSegs"), i = { light: 1, dark: 2 }[document.documentElement.dataset.theme] || 0;
    $$(".opt", t).forEach((o, k) => { o.classList.toggle("on", k === i); o.setAttribute("aria-pressed", String(k === i)); }); }
  segsIn("#themeSegs")?.addEventListener("pick", (e) => {
    const v = ["system", "light", "dark"][e.detail.index], root = document.documentElement;
    if (v === "system") delete root.dataset.theme; else root.dataset.theme = v;
  });
  segsIn("#colorblindSegs")?.addEventListener("pick", (e) => { if (e.detail.index) document.documentElement.dataset.colorblind = "1"; else delete document.documentElement.dataset.colorblind; });
  page?.addEventListener("pick", (e) => {
    if (e.target === tabs || e.target.closest("#themeSegs, #colorblindSegs")) return;
    const row = e.target.closest(".row"); if (row) say(row.querySelector(".name").textContent + "：" + e.detail.button.textContent.trim(), "ok");
  });
  for (const b of $$("#view-settings .row .text, #view-settings .pref-pick")) b.addEventListener("click", () => {
    if (b.matches("#langPick")) { BUI.picker(b, { items: [{ value: "system", label: "跟随系统" }, { value: "zh", label: "简体中文" }, { value: "en", label: "English" }, { value: "ja", label: "日本語" }], value: b.dataset.value || "system", placeholder: "语言…", onPick: (it) => { b.dataset.value = it.value; b.querySelector("span").textContent = it.label; } }); return; }
    say(b.textContent.trim() + "：示例里没有这一步");
  });

  // ---------- 顶栏与侧边栏底部 ----------
  $("#sync")?.addEventListener("click", (e) => { const b = e.currentTarget; b.classList.add("spin"); setTimeout(() => { b.classList.remove("spin"); say("6 个服务都已检查过", "ok"); }, 900); });
  $("#update")?.addEventListener("click", () => say("示例里不会真的更新"));
  $("#updateHide")?.addEventListener("click", () => { $("#update").hidden = true; });
  $("#sideGw")?.addEventListener("click", () => BUI.go("routing"));
})();
