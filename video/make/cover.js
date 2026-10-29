const puppeteer = require("puppeteer-core"), serve = require("./serve");
const CARDS = [
  { x: 70, y: 820, w: 560, h: 420, crop: [588, 100, 510, 330], view: "agents", act: (d) => d.querySelector('#agents .row[data-id="photo"] .field').click() },
  { x: 654, y: 820, w: 356, h: 198, crop: [904, 60, 175, 40], view: "settings", act: (d) => d.querySelector("#view-settings .row.pref .segs button:nth-of-type(3)").click() },
  { x: 654, y: 1042, w: 356, h: 198, crop: [887, 425, 196, 54], view: "settings", act: (d) => d.querySelector("#keepAwakeSegs button:nth-of-type(2)").click() },
  { x: 70, y: 1264, w: 300, h: 330, crop: [222, 82, 214, 226], view: "agents", act: (d) => d.querySelector('#agents .row[data-id="photo"] .ag-handle').click() },
  { x: 394, y: 1264, w: 616, h: 330, crop: [324, 316, 452, 186], view: "agents", act: (d, w) => { w.BUI.confirm("删除存储「对象存储」？", "使用它的服务会改存到 NAS 主盘，文件不会丢失。", "删除"); } },
];
(async () => {
  const srv = await serve(5179);
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await p.goto("http://localhost:5179/video/make/cover.html", { waitUntil: "networkidle0" });
  await p.evaluate(async (cards) => {
    await document.fonts.ready;
    const box = document.querySelector("#cards");
    const made = cards.map((c) => {
      const el = document.createElement("div"); el.className = "card";
      Object.assign(el.style, { left: c.x + "px", top: c.y + "px", width: c.w + "px", height: c.h + "px" });
      const f = document.createElement("iframe"); f.src = "/index.html"; el.append(f); box.append(el);
      const [cx, cy, cw, ch] = c.crop, k = Math.min(c.w / cw, c.h / ch);
      f.style.transform = `translate(${c.w / 2 - (cx + cw / 2) * k}px, ${c.h / 2 - (cy + ch / 2) * k}px) scale(${k})`;
      return { el, f };
    });
    for (const { f } of made) while (!f.contentWindow?.BUI || f.contentDocument.readyState !== "complete") await new Promise((r) => setTimeout(r, 50));
    made.forEach(({ el, f }, i) => {
      f.contentDocument.documentElement.dataset.theme = "light";
      f.contentWindow.BUI.go(cards[i].view);
      el.style.background = getComputedStyle(f.contentDocument.body).backgroundColor;
    });
    window.__made = made;
  }, CARDS.map(({ act, ...c }) => c));
  await new Promise((r) => setTimeout(r, 400));
  for (const [i, c] of CARDS.entries()) if (c.act) await p.evaluate(`(${c.act})(window.__made[${i}].f.contentDocument, window.__made[${i}].f.contentWindow)`).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: require("path").resolve(__dirname, "../cover.png") });
  await b.close(); srv.close();
})();
