// node capture.js preview 9.2 15.0 ...   -> ../tmp/preview-<t>.png at 1x
// node capture.js full                   -> ../tmp/frames/000000.jpg at 2x, every 1/30 s (also writes ../tmp/sfx.json)
const puppeteer = require("puppeteer-core"), fs = require("fs"), path = require("path"), serve = require("./serve");
const TMP = path.resolve(__dirname, "../tmp");
fs.mkdirSync(TMP, { recursive: true });
const FPS = 30;
(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  const full = mode === "full";
  const srv = await serve();
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars"] });
  const p = await b.newPage();
  p.on("console", (m) => { if (["error", "warn"].includes(m.type())) console.log("[page]", m.text()); });
  p.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: full ? 2 : 1 });
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto("http://localhost:5178/video/make/stage.html", { waitUntil: "networkidle0" });
  await p.evaluate(() => window.ready);
  const DUR = await p.evaluate(() => window.DUR);
  fs.writeFileSync(path.join(TMP, "sfx.json"), JSON.stringify(await p.evaluate(() => window.SFX)));
  if (full) fs.mkdirSync(path.join(TMP, "frames"), { recursive: true });
  const shots = full ? null : rest.map(Number).sort((a, b) => a - b);
  const total = full ? FPS * DUR : Math.ceil(Math.max(...shots) * FPS) + 1;
  let si = 0; const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = i / FPS;
    await p.evaluate((t) => window.render(t), t);
    if (full) {
      await p.screenshot({ path: path.join(TMP, "frames", `${String(i).padStart(6, "0")}.jpg`), type: "jpeg", quality: 94 });
      if (i % 60 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    } else {
      await new Promise((r) => setTimeout(r, 16)); // let rAF/timers run as a real frame would
      while (si < shots.length && shots[si] <= t + 1e-6) { await p.screenshot({ path: path.join(TMP, `preview-${shots[si].toFixed(1)}.png`) }); si++; }
    }
  }
  await b.close(); srv.close();
})();
