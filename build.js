// Builds the single-file release: better-ui.js = the stylesheet (injected as a <style>) + the script.
// node build.js   (no dependencies)
const fs = require("fs");
const css = fs.readFileSync(__dirname + "/src/better-ui.css", "utf8");
const js = fs.readFileSync(__dirname + "/src/better-ui.js", "utf8");
const out = `/*! better-ui · MIT · https://github.com/buer5/better-ui */
(function () {
  if (document.getElementById("better-ui-css")) return;
  const s = document.createElement("style");
  s.id = "better-ui-css";
  s.textContent = ${JSON.stringify(css)};
  (document.head || document.documentElement).appendChild(s);
})();
${js}`;
fs.writeFileSync(__dirname + "/better-ui.js", out);
console.log("better-ui.js", (out.length / 1024).toFixed(1) + " KB");
