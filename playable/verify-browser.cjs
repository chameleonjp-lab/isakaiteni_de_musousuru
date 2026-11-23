const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const { once } = require("node:events");
const { chromium } = require("playwright");

const sizes = [{width:402,height:700}, {width:700,height:402}];
const pageErrors = [];
const externalRequests = [];
const saveKey = "ou-to-escape-v1";

function button(page, name) {
  return page.getByRole("button", { name, exact:true });
}

function readSave(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
}

async function checkLayout(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    await locator.waitFor({ state:"visible" });
    assert.ok(await locator.evaluate(el => {
      const {left,top,right,bottom} = el.getBoundingClientRect();
      return left >= -.5 && top >= -.5 && right <= innerWidth+.5 && bottom <= innerHeight+.5;
    }), "Offscreen control: " + selector);
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page scrolls sideways");
}

async function openStep(page, token) {
  const title = await page.evaluate(id => puzzles[id][0], token);
  await button(page,title).tap();
}

async function seedOldSave(page, target) {
  await page.evaluate(({ key, target }) => {
    const legacy = story.fresh();
    for (const [id, step] of story.main) {
      for (const room of story.routeTo(legacy,step.room).slice(1)) {
        if (!story.move(legacy,room)) throw Error("Old save fixture could not enter " + room);
      }
      if (id === target) break;
      const proof = id === "M10" ? "cloak" : id === "M18" ? "white-lily" : null;
      if (!story.completeMain(legacy,id,proof)) throw Error("Old save fixture could not complete " + id);
    }
    localStorage.setItem(key,JSON.stringify({run:legacy,audioEnabled:false}));
  }, { key:saveKey, target });
  await page.reload();
}

async function startAndRotate(page, viewport) {
  await checkLayout(page, ["#help","#audio","#stage-close","#content",".tabs"]);
  await button(page,"手元").tap();
  assert.equal(await button(page,"手元").getAttribute("aria-pressed"),"true");
  await page.locator("#content").getByRole("button",{ name:"第一の声", exact:true }).tap();
  await button(page,"伏せたまま待つ").tap();
  await button(page,"続ける").tap();
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);

  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await checkLayout(page, ["#stage-close","#content",".tabs"]);
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);
  await button(page,"第二の声").tap();
  await button(page,"今、顔を上げる").tap();
  await button(page,"続ける").tap();
  await button(page,"移動").tap();
  await page.locator("#content h2").waitFor({state:"visible"});
  assert.equal(await page.locator("#content h2").textContent(),"隣の部屋");
}

async function failAndRewind(page) {
  await seedOldSave(page,"M17");
  await checkLayout(page, ["#stage-close","#stage-door","#content",".tabs"]);
  await button(page,"扉手元").tap();
  assert.equal(await button(page,"扉手元").getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#audio").textContent(),"音オフ");
  await seedOldSave(page,"M18");
  await openStep(page,"M18");
  await button(page,"巡回環をかざす").tap();
  await button(page,"マントを使って中央を渡る").tap();
  assert.equal((await readSave(page)).run.failure.event,"E278");
  await page.reload();
  await button(page,"安全だった直前に戻る").tap();
  const { run } = await readSave(page);
  assert.equal(run.world.room,"Q02");
  assert.equal(run.world.seen,false);
  assert.equal(run.failure,null);
  assert.equal(run.world.main.at(-1),"M17");
}

async function exitCastle(page) {
  await seedOldSave(page,"M20");
  await openStep(page,"M20");
  await button(page,"境石の手前で立ち止まる").tap();
  assert.equal((await readSave(page)).run.world.escaped,false);
  await button(page,"調べ直す").tap();
  await button(page,"境石を越え、外の草地を踏む").tap();
  assert.equal((await readSave(page)).run.world.escaped,false);
  await page.getByRole("heading",{ name:"もう客ではない", exact:true }).waitFor({state:"visible",timeout:30000});
  const done = (await readSave(page)).run.world;
  assert.equal(done.escaped,true);
  assert.equal(done.main.length,20);
  await page.reload();
  assert.equal(await page.locator("#room").textContent(),"城の外");
}

async function program() {
  const path = process.argv[2];
  if (!path) throw Error("Usage: node playable/verify-browser.cjs /path/to/index.html");
  const html = await fs.readFile(path);
  const server = http.createServer((req,res) => {
    if (req.url !== "/") { res.writeHead(404).end(); return; }
    res.writeHead(200,{"content-type":"text/html; charset=utf-8"}).end(html);
  });
  server.listen(0,"127.0.0.1");
  await once(server,"listening");
  const origin = "http://127.0.0.1:" + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
    for (const viewport of sizes) {
      const page = await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        externalRequests.push(url.href);
        return route.abort();
      });
      await page.goto(origin);
      await startAndRotate(page,viewport);
      await failAndRewind(page);
      await exitCastle(page);
      await page.close();
      console.log("Chromium: " + viewport.width + "×" + viewport.height + ", rotate, reload, rewind and escape.");
    }
    const fallback = await browser.newPage();
    fallback.on("pageerror", error => pageErrors.push(error.message));
    await fallback.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (type.includes("webgl")) return null;
        return getContext.call(this,type,...options);
      };
    });
    await fallback.goto(origin);
    await fallback.locator("#stage.unavailable").waitFor();
    await seedOldSave(fallback,"M20");
    await button(fallback,"境石と夜露").click();
    await button(fallback,"境石を越え、外の草地を踏む").click();
    assert.equal((await readSave(fallback)).run.world.escaped,true);
    await fallback.close();
    assert.deepEqual(externalRequests,[]);
    assert.deepEqual(pageErrors,[]);
    console.log("The game is playable without 3D. No external requests or page errors.");
  } finally {
    try { await browser?.close(); }
    finally { server.close(); }
  }
}

program().catch(error => { console.error(error); process.exitCode = 1; });
