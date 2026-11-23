const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const { once } = require("node:events");
const { chromium } = require("playwright");

const sizes = [{width:402,height:700}, {width:700,height:402}, {width:874,height:402}];
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
  await button(page,"調べる").tap();
  await page.locator("#content").getByRole("button",{name:title,exact:true}).tap();
  await page.locator("#desk-panel").waitFor({state:"hidden"});
}

async function checkExploration(page) {
  await page.locator("#desk-panel").waitFor({state:"hidden"});
  await checkLayout(page,["#castle-canvas","[data-tab=scene]",".tabs-tools"]);
  assert.ok(await page.locator("#castle-canvas").evaluate(canvas => {
    const rect=canvas.getBoundingClientRect();
    return rect.width >= innerWidth * .99 && rect.height >= innerHeight * .85 &&
      document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height*.76) === canvas;
  }),"3D exploration should fill the viewport and receive touches behind the former menu");
}

async function seedOldSave(page, target, room = null) {
  await page.evaluate(({ key, target, room }) => {
    const legacy = story.fresh();
    for (const [id, step] of story.main) {
      for (const room of story.routeTo(legacy,step.room).slice(1)) {
        if (!story.move(legacy,room)) throw Error("Old save fixture could not enter " + room);
      }
      if (id === target) break;
      const proof = id === "M10" ? "cloak" : id === "M18" ? "white-lily" : null;
      if (!story.completeMain(legacy,id,proof)) throw Error("Old save fixture could not complete " + id);
    }
    if (room && !story.move(legacy,room)) throw Error("Old save fixture could not enter " + room);
    localStorage.setItem(key,JSON.stringify({run:legacy,audioEnabled:false}));
  }, { key:saveKey, target, room });
  await page.reload();
}

async function holdStick(page, vertical, finish) {
  const input = await page.context().newCDPSession(page);
  const stick = await page.locator("#walk-stick").boundingBox();
  const x = Math.round(stick.x + stick.width / 2);
  const y = Math.round(stick.y + stick.height / 2);
  await input.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[{x,y}] });
  await input.send("Input.dispatchTouchEvent", { type:"touchMove", touchPoints:[{x,y:y+vertical*28}] });
  try {
    await page.waitForFunction(finish, saveKey);
  } finally {
    await input.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] });
    await input.detach();
  }
}

async function startAndRotate(page, viewport) {
  await checkLayout(page, ["#help","#audio","#stage-close","#audience-call"]);
  await checkExploration(page);
  await button(page,"手元").tap();
  assert.equal(await button(page,"手元").getAttribute("aria-pressed"),"true");
  await button(page,"第一の声").tap();
  await button(page,"伏せたまま待つ").tap();
  await button(page,"続ける").tap();
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);

  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await checkLayout(page, ["#stage-close","#audience-call"]);
  await checkExploration(page);
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);
  await button(page,"第二の声").tap();
  await button(page,"今、顔を上げる").tap();
  await button(page,"続ける").tap();
  await page.locator("#walk-stick:enabled").waitFor({state:"visible"});
  await checkLayout(page, ["#walk-stick","[data-tab=scene]"]);
  await checkExploration(page);
  const before=await page.locator("#castle-canvas").boundingBox();
  await button(page,"出口").tap();
  await page.locator("#content h2").waitFor({state:"visible"});
  assert.equal(await page.locator("#content h2").textContent(),"出口");
  assert.equal(await button(page,"出口").getAttribute("aria-expanded"),"true");
  assert.deepEqual(await page.locator("#castle-canvas").boundingBox(),before);
  await button(page,"持ち物").tap();
  assert.equal(await page.locator("#content h2").textContent(),"持ち物");
  await button(page,"手帳").tap();
  assert.equal(await page.locator("#content h2").textContent(),"記憶の手帳");
  await button(page,"探索に戻る").tap();
  await checkExploration(page);
  assert.equal((await readSave(page)).run.world.room,"C01");
  await holdStick(page,1,key => JSON.parse(localStorage.getItem(key)).run.world.room === "C02");
  assert.equal((await readSave(page)).run.world.room,"C02");
  await page.reload();
  await page.locator("#walk-stick:enabled").waitFor({state:"visible"});
  assert.equal((await readSave(page)).position.room,"C02");
  await checkExploration(page);
}

async function failAndRewind(page) {
  await seedOldSave(page,"M17");
  await checkLayout(page, ["#stage-close","#stage-door","#walk-stick","[data-tab=scene]"]);
  await checkExploration(page);
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
  await page.locator("#dialog").waitFor({state:"hidden"});
  await page.locator("#walk-stick:enabled").waitFor({state:"visible"});
  await holdStick(page,-1,key => JSON.parse(localStorage.getItem(key)).run.failure?.event === "E280");
}

async function exitCastle(page) {
  await seedOldSave(page,"M20","Q04");
  await page.locator("#walk-stick:enabled").waitFor({state:"visible"});
  await holdStick(page,-1,key => JSON.parse(localStorage.getItem(key)).run.world.room === "Q05");
  await openStep(page,"M20");
  assert.equal((await readSave(page)).run.world.escaped,false);
  assert.equal(await button(page,"境石を越え、外の草地を踏む").count(),0);
  await button(page,"戻る").tap();
  await page.keyboard.down("ArrowRight");
  try {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).position?.x > 1.1, saveKey);
  } finally { await page.keyboard.up("ArrowRight"); }
  assert.equal((await readSave(page)).run.world.escaped,false);
  await page.keyboard.down("ArrowUp");
  try {
    await page.getByRole("heading",{ name:"もう客ではない", exact:true }).waitFor({state:"visible",timeout:30000});
  } finally { await page.keyboard.up("ArrowUp"); }
  const done = (await readSave(page)).run.world;
  assert.equal(done.escaped,true);
  assert.equal(done.main.length,20);
  await page.reload();
  assert.equal(await page.locator("#room").textContent(),"城の外");
}

async function verifyDialogueAndFinish(page) {
  const dialogue = page.locator("#dialog-actions button");
  await button(page,"第一の声").click();
  assert.equal(await dialogue.count(),4);
  await button(page,"すぐに顔を上げる").click();
  assert.equal((await readSave(page)).run.failure.event,"E002");
  await button(page,"安全だった直前に戻る").click();
  await button(page,"第一の声").click();
  await button(page,"伏せたまま待つ").click();
  await button(page,"続ける").click();
  await button(page,"第二の声").click();
  assert.equal(await dialogue.count(),4);
  const minutes=(await readSave(page)).run.world.minutes;
  await button(page,"伏せたまま様子をうかがう").click();
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);
  assert.equal((await readSave(page)).run.world.minutes,minutes);
  await page.reload();
  await button(page,"第二の声").click();
  await button(page,"伏せたまま様子をうかがう").click();
  assert.equal((await readSave(page)).run.failure.heading,"同じ行動を怪しまれた");
  await button(page,"安全だった直前に戻る").click();

  const missions=await page.evaluate(()=>[...story.main.values()].slice(1).map(m=>[m.id,m.room,puzzles[m.id][3]]));
  for (const [id,room,correct] of missions) {
    const route=await page.evaluate(target=>story.routeTo(run,target).slice(1).map(r=>story.rooms.get(r).name),room);
    for (const name of route) {
      await button(page,"移動").click();
      const target=page.locator("#content button").filter({hasText:name});
      assert.equal(await target.count(),1,name);
      await target.click();
    }
    const label=await page.evaluate(id=>puzzles[id][0],id);
    await page.locator("#content").getByRole("button",{name:label,exact:true}).first().click();
    if (id==="M10") await button(page,"マントを羽織る").click();
    if (id==="M18") {
      await button(page,"巡回環をかざす").click();
      await page.getByText("巡回環　空番。二つの欠けが重なった。",{exact:true}).waitFor();
    }
    await button(page,id==="M18" ? "白百合の壁際を渡る" : correct).click();
    assert.ok((await readSave(page)).run.world.main.includes(id),id);
    if (id!=="M20") await button(page,"続ける").click();
    if (id==="M02") {
      await button(page,"王女リゼに声をかける").click();
      assert.equal(await dialogue.count(),4);
      await button(page,"自分の言葉で書いたことなら、あとでも読めると答える").click();
      await page.locator("#dialog-actions").getByRole("button",{name:"閉じる",exact:true}).click();
      await button(page,"佩剣に手をかける").click();
      assert.equal(await dialogue.count(),4);
      await page.locator("#dialog-close").click();
    }
  }
  assert.ok((await readSave(page)).run.world.escaped);
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
      console.log("Chromium: " + viewport.width + "×" + viewport.height + ", exploration viewport, on-demand menus, touch stick, corridor crossing, rotate, reload, rewind and walking escape.");
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
    await verifyDialogueAndFinish(fallback);
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
