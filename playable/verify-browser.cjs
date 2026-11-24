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

async function revealOptions(page, input) {
  const advance = page.locator("#dialog-next");
  for (let line = 0; line < 24 && await advance.isVisible(); line++) {
    await advance[input]();
  }
  assert.equal(await advance.isVisible(),false,"Dialogue should show actions after the last line");
}

async function choose(page, name, input = "tap") {
  await revealOptions(page,input);
  await button(page,name)[input]();
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

async function seedOldSave(page, target, room = null, position = null) {
  await page.evaluate(({ key, target, room, position }) => {
    const legacy = story.fresh();
    for (const [id, step] of story.main) {
      for (const room of story.routeTo(legacy,step.room).slice(1)) {
        if (!story.move(legacy,room)) throw Error("Old save fixture could not enter " + room);
      }
      if (id === target) break;
      const proof = id === "M10" ? "cloak" : id === "M18" ? "white-lily" : null;
      if (!story.completeMain(legacy,id,proof)) throw Error("Old save fixture could not complete " + id);
    }
    if (room) {
      const route = story.routeTo(legacy,room);
      if (!route.length) throw Error("Old save fixture could not find " + room);
      for (const step of route.slice(1)) {
        if (!story.move(legacy,step)) throw Error("Old save fixture could not enter " + step);
      }
    }
    localStorage.setItem(key,JSON.stringify({run:legacy,audioEnabled:false,position}));
  }, { key:saveKey, target, room, position });
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
  await button(page,"一度目の呼びかけ").tap();
  await page.locator("#dialog-next").waitFor({state:"visible"});
  assert.equal(await page.locator("#dialog-kicker").textContent(),"国王");
  assert.equal(await page.locator("#stage").getAttribute("data-speaking"),"true");
  assert.equal(await page.locator("#audience-call").isVisible(),false);
  assert.equal(await page.locator("[data-tab=scene]").isVisible(),false);
  assert.equal(await page.locator("#dialog-actions").isVisible(),false);
  if (viewport.width === 402) {
    const next = page.locator("#dialog-next");
    if (await next.getAttribute("aria-label") === "セリフを最後まで表示") {
      await next.evaluate(node => {
        if (node.getAttribute("aria-label") === "セリフを最後まで表示") node.click();
      });
    }
    assert.equal(await page.locator("#dialog-actions").isVisible(),false);
    await page.emulateMedia({reducedMotion:"reduce"});
  }
  assert.equal(await page.locator("#dialog-copy").textContent(),"面を上げよ");
  await page.locator("#dialog-next").tap();
  assert.match(await page.locator("#dialog-copy").textContent(),/赤い絨毯/);
  assert.equal(await page.locator("#dialog-actions").isVisible(),false);
  await checkLayout(page,[".dialog-content","#dialog-next"]);
  const text = await page.locator(".dialog-content").boundingBox();
  assert.ok(text.y > (await page.evaluate(() => innerHeight)) / 2);
  await revealOptions(page,"tap");
  await checkLayout(page,["#dialog-actions",".dialog-content"]);
  const options = await page.locator("#dialog-actions").boundingBox();
  assert.ok(options.y + options.height <= text.y && options.x >= text.x);
  const width = await page.evaluate(() => innerWidth);
  assert.ok(Math.abs(options.x + options.width / 2 - width / 2) < 5,"Choices are centered in the conversation");
  assert.ok(await page.locator("#dialog-actions").evaluate(menu => menu.scrollHeight <= menu.clientHeight + 1),
    "All conversation choices fit without scrolling at the checked sizes");
  assert.equal(await page.locator("#dialog-actions button:visible").count(),4);
  await button(page,"頭を下げたまま待つ").tap();
  await choose(page,"続ける");
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);

  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await checkLayout(page, ["#stage-close","#audience-call"]);
  await checkExploration(page);
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);
  await button(page,"二度目の呼びかけ").tap();
  await choose(page,"今度は顔を上げる");
  await choose(page,"続ける");
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
  assert.equal(await page.locator("#content h2").textContent(),"探索の手帳");
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

async function walkAroundPillar(page) {
  await seedOldSave(page,"M03","C01",{room:"C01",x:-5.3,z:1.5,yaw:0});
  await page.locator("#walk-stick:enabled").waitFor({state:"visible"});
  await page.keyboard.down("ArrowUp");
  try {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).position?.z < 1.2,saveKey);
    await page.waitForTimeout(600);
    assert.ok((await readSave(page)).position.z > .44, "The player must stop at the throne-room pillar");
  } finally { await page.keyboard.up("ArrowUp"); }
  await page.keyboard.down("ArrowRight");
  try {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).position?.x > -4.4,saveKey);
  } finally { await page.keyboard.up("ArrowRight"); }
  await page.keyboard.down("ArrowUp");
  try {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).position?.z < -.8,saveKey);
  } finally { await page.keyboard.up("ArrowUp"); }
}

async function failAndRewind(page) {
  await seedOldSave(page,"M17");
  await checkLayout(page, ["#stage-close","#stage-door","#walk-stick","[data-tab=scene]"]);
  await checkExploration(page);
  await button(page,"扉を見る").tap();
  assert.equal(await button(page,"扉を見る").getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#audio").textContent(),"音なし");
  await seedOldSave(page,"M18");
  await openStep(page,"M18");
  await choose(page,"巡回環をかざす");
  await button(page,"マントで姿を隠して中央を渡る").tap();
  assert.equal((await readSave(page)).run.failure.event,"E278");
  await page.reload();
  await button(page,"直前の安全な場面に戻る").tap();
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
  await revealOptions(page,"tap");
  assert.equal(await button(page,"境石を越えて城の外の草地に出る").count(),0);
  await choose(page,"戻る");
  await page.keyboard.down("ArrowRight");
  try {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).position?.x > 1.1, saveKey);
  } finally { await page.keyboard.up("ArrowRight"); }
  assert.equal((await readSave(page)).run.world.escaped,false);
  await page.keyboard.down("ArrowUp");
  try {
    await page.getByRole("heading",{ name:"城の外へ", exact:true }).waitFor({state:"visible",timeout:30000});
  } finally { await page.keyboard.up("ArrowUp"); }
  const done = (await readSave(page)).run.world;
  assert.equal(done.escaped,true);
  assert.equal(done.main.length,20);
  await page.reload();
  assert.equal(await page.locator("#room").textContent(),"城の外");
}

async function verifyDialogueAndFinish(page) {
  const dialogue = page.locator("#dialog-actions button");
  await button(page,"一度目の呼びかけ").click();
  assert.equal(await page.locator("#dialog-actions").isVisible(),false);
  await revealOptions(page,"click");
  assert.equal(await dialogue.count(),4);
  await button(page,"言われてすぐ顔を上げる").click();
  assert.equal((await readSave(page)).run.failure.event,"E002");
  assert.match((await readSave(page)).run.failure.body,/ルオの指がまだ床/);
  await button(page,"直前の安全な場面に戻る").click();
  await button(page,"一度目の呼びかけ").click();
  await choose(page,"頭を下げたまま待つ","click");
  await choose(page,"続ける","click");
  await button(page,"二度目の呼びかけ").click();
  assert.equal(await dialogue.count(),4);
  const minutes=(await readSave(page)).run.world.minutes;
  await choose(page,"頭を下げたまま様子を見る","click");
  assert.deepEqual((await readSave(page)).run.world.main,["M01"]);
  assert.equal((await readSave(page)).run.world.minutes,minutes);
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.run.warnings = ["P01 伏せたまま様子をうかがう"];
    localStorage.setItem(key,JSON.stringify(saved));
  },saveKey);
  await page.reload();
  await button(page,"二度目の呼びかけ").click();
  await choose(page,"頭を下げたまま様子を見る","click");
  assert.equal((await readSave(page)).run.failure.heading,"繰り返した行動を怪しまれた");
  assert.match((await readSave(page)).run.failure.body,/もう一度選んだ行動「頭を下げたまま様子を見る」/);
  await button(page,"直前の安全な場面に戻る").click();

  const missions=await page.evaluate(()=>[...story.main.values()].slice(1).map(m=>[m.id,m.room,puzzles[m.id][3]]));
  for (const [id,room,correct] of missions) {
    const route=await page.evaluate(target=>story.routeTo(run,target).slice(1).map(r=>story.rooms.get(r).name),room);
    for (const name of route) {
      await button(page,"移動").click();
      const target=page.locator("#content button").filter({hasText:new RegExp("^"+RegExp.escape(name))});
      assert.equal(await target.count(),1,name);
      await target.click();
    }
    const label=await page.evaluate(id=>puzzles[id][0],id);
    await page.locator("#content").getByRole("button",{name:label,exact:true}).first().click();
    if (id==="M10") await choose(page,"マントを羽織る","click");
    if (id==="M18") {
      await choose(page,"巡回環をかざす","click");
      await page.getByText("切れ目が重なった。今なら渡れる。",{exact:true}).waitFor();
    }
    await choose(page,id==="M18" ? "白百合の壁際を渡る" : correct,"click");
    assert.ok((await readSave(page)).run.world.main.includes(id),id);
    if (id!=="M20") await choose(page,"続ける","click");
    if (id==="M02") {
      await button(page,"王女リゼに声をかける").click();
      assert.equal(await dialogue.count(),4);
      await choose(page,"自分で書いた言葉なら、あとから読み返せると答える","click");
      await revealOptions(page,"click");
      await page.locator("#dialog-actions").getByRole("button",{name:"閉じる",exact:true}).click();
      await button(page,"腰の剣に手をかける").click();
      assert.equal(await dialogue.count(),4);
      await choose(page,"衛兵の槍を奪う","click");
      assert.equal((await readSave(page)).run.failure.heading,"奪おうとした槍");
      assert.match((await readSave(page)).run.failure.body,/槍を奪おうとキリの手元/);
      await button(page,"直前の安全な場面に戻る").click();
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
    browser = await chromium.launch({executablePath:process.env.CASTLE_CHROMIUM, args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
    for (const viewport of sizes) {
      const page = await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,
        reducedMotion:viewport.width === 402 ? "no-preference" : "reduce"});
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        externalRequests.push(url.href);
        return route.abort();
      });
      await page.goto(origin);
      await startAndRotate(page,viewport);
      if (viewport.width === 402) await walkAroundPillar(page);
      await failAndRewind(page);
      await exitCastle(page);
      await page.close();
      console.log("Chromium: " + viewport.width + "×" + viewport.height + ", exploration viewport, on-demand menus, touch stick, corridor crossing, rotate, reload, rewind and walking escape.");
    }
    const fallback = await browser.newPage({reducedMotion:"reduce"});
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
