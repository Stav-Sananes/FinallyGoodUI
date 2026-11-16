// Delivery gate G10 extras: 1440 px at 50% zoom (a 2880 px CSS viewport) and always-visible scrollbars.
const { chromium } = require("playwright");
const base = process.argv[2], shots = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const wide = await (await b.newContext({ viewport: { width: 2880, height: 1800 } })).newPage();
  await wide.goto(`${base}/index.html?view=all&issue=ING-214`); await wide.waitForSelector(".row");
  const w = await wide.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, panel: document.querySelector("#panel").offsetWidth, proseCh: Math.round(document.querySelector(".prose p").offsetWidth / parseFloat(getComputedStyle(document.querySelector(".prose p")).fontSize) * 2) }));
  await wide.screenshot({ path: `${shots}/g10-2880-zoom50.png` });
  const sb = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await sb.addInitScript(() => addEventListener("DOMContentLoaded", () => {
    const s = document.createElement("style");
    s.textContent = "::-webkit-scrollbar{width:15px;height:15px;background:#ccc}::-webkit-scrollbar-thumb{background:#888}";
    document.head.append(s);
  }));
  await sb.goto(`${base}/index.html?view=all&issue=ING-214`); await sb.waitForSelector(".row");
  const s = await sb.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, listScrollbar: document.querySelector("#list-wrap").offsetWidth - document.querySelector("#list-wrap").clientWidth }));
  await sb.screenshot({ path: `${shots}/g10-1440-scrollbars.png` });
  console.log(JSON.stringify({ zoom50: w, scrollbars: s }));
  await b.close();
})();
