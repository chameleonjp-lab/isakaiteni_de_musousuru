const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createStory } = require("../model.js");

const threePath = process.argv[2];
if (!threePath) throw new Error("Usage: node playable/stages/verify.cjs /path/to/three.min.js");
const read = name => fs.readFileSync(path.join(__dirname, name), "utf8");
const scenarios = path.join(__dirname, "../../docs/scenario/data");
const load = file => JSON.parse(fs.readFileSync(path.join(scenarios, file), "utf8"));
const data = Object.fromEntries(["main","rooms","people","items","escape"].map(key => [key, load(key+".json")]));
data.threads = fs.readdirSync(path.join(scenarios,"threads")).sort().map(file => load("threads/"+file));

const gradient = { addColorStop() {} };
const paint = new Proxy({
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient,
  getImageData: () => ({data: new Uint8ClampedArray(4)})
}, {
  get(target, key) { return target[key] ?? (() => {}); }
});
const document = { createElement: () => ({getContext: () => paint}) };
const context = vm.createContext({ window: {}, document, CASTLE_DATA: data, story: createStory(data) });
vm.runInContext(fs.readFileSync(threePath, "utf8"), context);
for (const name of ["characters","items","environments","stage1","stage2","stage3","bridge"]) {
  vm.runInContext(read(name+".js"), context, { filename:name+".js" });
}
vm.runInContext(read("../walk.js"), context, { filename:"walk.js" });

const result = vm.runInContext(`
(() => {
  function requireThat(condition, description) {
    if (!condition) throw new Error(description);
  }
  const map = window.CastleEscapeEnvironments;
  for (const room of story.rooms.keys()) {
    const area = map.createEnvironment(room);
    area.group.updateMatrixWorld(true);
    area.obstacles = [];
    area.group.traverse(node => {
      if (node.userData.walkObstacle) area.obstacles.push(new THREE.Box3().setFromObject(node));
    });
    const exits = area.corridorPortals.map(portal => portal.targetId).sort();
    requireThat(area.id === room && exits.join() === story.neighbors.get(room).slice().sort().join(), room+" の行き先が一致");
    for (const portal of area.corridorPortals) {
      const canStand = depth => castleWalkable(area,portal.entryX+portal.dirX*depth,portal.entryZ+portal.dirZ*depth);
      for (let depth=-1.05; depth<portal.length-.36; depth+=.08) {
        requireThat(canStand(depth),room+" → "+portal.targetId+" の通路が塞がっていない");
      }
      portal.barrier.visible = true;
      requireThat(!canStand(.6),room+" → "+portal.targetId+" は閉鎖中に通れない");
      portal.barrier.visible = false;
    }
    disposeCastleStage({root:area.group});
  }
  const stage = createCastleStage();
  const entries = CASTLE_STAGE_LIBRARIES.flatMap(([module,key]) => Object.entries(module[key]));
  const run = story.fresh();
  run.world.side.push("E152");
  run.world.choices.E152 = ["B"];
  requireThat(!castleStageState(story,run).grateOpen,"南門：一礼だけでは閉鎖");
  run.world.choices.E152.push("A");
  requireThat(castleStageState(story,run).grateOpen,"南門：正しい礼で格子だけ開放");

  function update(duration) {
    for (let t=0; t<duration; t+=.05) stage.update(.05,t)?.();
  }

  let variants = 0;
  for (const [room,config] of entries) {
    const ctrl = stage.setRoom(room);
    for (const {id} of config.variants) {
      requireThat(stage.play(id),room+" "+id);
      update(ctrl.getTotalDuration()+.12);
      requireThat(ctrl.getStatusText().length > 0,room+" "+id+" に表示がある");
      variants++;
    }
    requireThat(stage.scene.children.length === 3,room+" の場面は一組");
  }

  const gate = stage.setRoom("S04");
  stage.restore({grateOpen:false});
  requireThat(gate._inspect.props.innerGrate.position.y === 0, "格子の閉状態を復元");
  stage.restore({grateOpen:true});
  requireThat(gate._inspect.props.innerGrate.position.y === 2.6, "格子の開状態を復元");
  for (const [room,prop] of [["S01","i04"],["G01","i06"],["N03","i10"],["E02","item"]]) {
    const ctrl = stage.setRoom(room,{itemState:"hidden"});
    requireThat(!ctrl._inspect.props[prop].group.visible, room+" 未開封の品は非表示");
  }

  const stairs = stage.setRoom("Q04");
  requireThat(stairs._inspect.stepMeshes.length === 8, "石段8段");
  for (const step of stairs._inspect.stepMeshes) {
    const box = new THREE.Box3().setFromObject(step);
    const center = box.getCenter(new THREE.Vector3());
    requireThat(Math.abs(box.max.y-stairs._inspect.getSurfaceY(center.x,center.z)) < 1e-6, "石段と足元の高さ");
  }
  requireThat(stairs._inspect.getSurfaceY(1.8,7.7) === 0, "段の横は床の高さ");

  const boundary = stage.setRoom("Q05");
  const required = {collarRemoved:true,detectedAfterRemoval:false,passedRoyalEntranceThisRun:true};
  for (const [id,expected] of [["clearSuccess",1],["stopBeforeStone",0],["failCollarOn",0],
    ["failDetectedCloak",0],["failWrongRun",0],["failOuterToInner",0]]) {
    stage.play(id);
    update(6);
    requireThat(boundary._inspect.getState().clearTriggerCount === expected,id+"のクリア発火回数");
  }
  for (const [flag,value] of [["collarRemoved",false],["detectedAfterRemoval",true],["passedRoyalEntranceThisRun",false]]) {
    stage.restore({...required,[flag]:value,escaped:false});
    stage.play("clearSuccess");
    update(6);
    requireThat(!boundary.hasCleared(),flag+"でクリアが不成立");
  }
  stage.restore({...required,escaped:false});
  stage.play("clearSuccess");
  update(6);
  requireThat(boundary.hasCleared(),"条件を満たした同じ逃走でクリア");
  stage.restore({...required,escaped:false,heroPos:[1.2,-2.1]});
  update(1);
  requireThat(!boundary.hasCleared() && boundary._inspect.getState().clearTriggerCount === 0,"場外の未クリア保存を復元");

  let cancelled;
  stage.play("clearSuccess", value => { cancelled = value; });
  stage.setRoom("C01");
  requireThat(cancelled === false,"切り替え前の境界演出を無効化");
  for (let i=0;i<50;i++) {
    const [room] = entries[i%entries.length];
    const ctrl = stage.setRoom(room);
    let released = 0;
    ctrl.root.traverse(node => {
      if (node.geometry) node.geometry.addEventListener("dispose", () => { released++; });
    });
    stage.setRoom(null);
    requireThat(stage.scene.children.length === 2,room+" から離れた後は照明だけ");
    requireThat(released > 0,room+"の描画用形状を解放");
  }
  return {rooms:entries.length,variants};
})()
`, context);

assert.deepEqual({...result}, {rooms:22,variants:47});
console.log("全22場面・47見本、南門、未開封品、石段、境界と保存復元、50回の場面切り替えを確認。");
console.log("全59地点の通路の接続、通行幅、閉鎖を確認。");
