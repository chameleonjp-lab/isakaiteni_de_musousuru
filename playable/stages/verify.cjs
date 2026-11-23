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
  getImageData: () => ({data: new Uint8ClampedArray(4)}),
  measureText: text => ({width: text.length * 13})
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
vm.runInContext(read("../residents.js"), context, { filename:"residents.js" });
vm.runInContext(read("../nameplates.js"), context, { filename:"nameplates.js" });

const result = vm.runInContext(`
(() => {
  function requireThat(condition, description) {
    if (!condition) throw new Error(description);
  }
  const map = window.CastleEscapeEnvironments;
  for (const room of story.rooms.keys()) {
    const area = map.createEnvironment(room);
    area.obstacles = castleObstacles(area.group);
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
  const solids = [
    ["C01", -5.3, -.2, "列柱"],
    ["C08", -2.3, 1, "ベッド"],
    ["S05", -1.8, -1.2, "馬車"],
    ["G03", 3.2, 0, "木の幹"],
    ["G06", 0, 0, "池"],
    ["Q05", 0, 0, "境石"]
  ];
  for (const [room,x,z,name] of solids) {
    const area = map.createEnvironment(room);
    area.obstacles = castleObstacles(area.group);
    requireThat(!castleWalkable(area,x,z),room+" の"+name+"を通り抜けられない");
    const safe = castleSafePosition(area,x,z);
    requireThat(castleWalkable(area,safe.x,safe.z),room+" の旧セーブを歩ける位置に復元");
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

  function snapshotWalk(room, state, check) {
    const ctrl = stage.setRoom(room,state);
    const area = ctrl.env;
    area.obstacles = castleObstacles(ctrl.root);
    check(area);
  }
  for (const open of [false,true]) {
    snapshotWalk("S04",{grateOpen:open},area => {
      requireThat(castleWalkable(area,0,-5.5) === open,"南門の格子は礼法に応じて歩行を止める");
      requireThat(!castleWalkable(area,0,-6.18),"南門の外扉はいつも通れない");
      const start = {x:0,z:-4.9};
      castleMove(area,start,0,-1);
      requireThat(open ? start.z < -5.6 : start.z > -5.3,"厚みの薄い格子を飛び越さない");
    });
    snapshotWalk("Q01",{doors:{W04Open:!open,Q02Open:open},collarRemoved:open},area => {
      const door = area.corridorPortals.find(portal => portal.targetId === "Q02");
      const stand = depth => castleWalkable(area,door.entryX+door.dirX*depth,door.entryZ+door.dirZ*depth);
      requireThat(stand(-.24) === open,"首輪を外した場合だけQ02側の木扉を通れる");
      if (open) for (let depth=-1.1;depth<.5;depth+=.05) {
        requireThat(stand(depth),"開いた木扉はQ02への通行を妨げない");
      }
    });
  }

  function update(duration) {
    for (let t=0; t<duration; t+=.05) stage.update(.05,t)?.();
  }

  const foundResidents = new Set();
  for (const room of story.rooms.keys()) {
    const ctrl = stage.setRoom(room,{audienceStep:2});
    const area = ctrl?.env ?? map.createEnvironment(room);
    const root = ctrl?.root ?? area.group;
    area.obstacles = castleObstacles(root);
    const residents = placeCastleResidents(area,ctrl);
    for (const resident of residents) {
      const {x,y,z} = resident.root.position;
      const person = story.cast.get(resident.model.id);
      requireThat(person.room === room,person.name+" はシナリオの部屋にいる");
      if (y === 0) requireThat(castleWalkable(area,x,z),person.name+" の立ち位置に家具や壁がない");
      const height = resident.root.position.y;
      resident.update(4.2);
      requireThat(resident.root.position.y === height,person.name+" は動作中も正しい高さに立つ");
    }
    const staged = Object.values(ctrl?._inspect?.actors || {})
      .filter(actor => actor.rig.visible && story.cast.get(actor.charObj.id)?.room === room)
      .map(actor => actor.charObj.id);
    const actors = [...staged, ...residents.map(resident => resident.model.id)].sort();
    const expected = [...story.cast.values()].filter(person => person.room === room).map(person => person.id).sort();
    requireThat(actors.join() === expected.join(),room+" の配置がゲームの人物台帳と一致");
    for (const actor of actors) foundResidents.add(actor);
    area.obstacles = castleObstacles(root);
    for (const portal of area.corridorPortals) {
      for (let depth=-1.05; depth<portal.length-.36; depth+=.08) {
        const x=portal.entryX+portal.dirX*depth, z=portal.entryZ+portal.dirZ*depth;
        // Q01 and W04 have additional swing doors managed by the scenario.
        if (["Q01","W04"].includes(room)) break;
        requireThat(castleWalkable(area,x,z),room+" → "+portal.targetId+" に人物や家具が重ならない");
      }
    }
    if (!ctrl) disposeCastleStage({root});
  }
  requireThat(foundResidents.size === 36,"36人全員に配置場所がある");

  const named = window.CastleEscapeModels.createCharacter("P02",{});
  const nameplate = createCastleNameplate(named,story.cast.get("P02").name,true);
  const sprite = named.headPivot.children.find(node => node.isSprite);
  const camera = new THREE.PerspectiveCamera(54,402/652,.05,150);
  camera.position.set(0,1.8,5);
  camera.lookAt(0,1.8,0);
  camera.updateMatrixWorld();
  nameplate.resize(2/(652*camera.projectionMatrix.elements[5]));
  requireThat(sprite.name === "王女リゼ" && sprite.material.depthTest && !sprite.material.sizeAttenuation,
    "名前を頭に固定し、手前の物に隠れ、遠くからも読める大きさで表示する");
  const placeHead = (x,y = 0) => {
    const head = sprite.getWorldPosition(new THREE.Vector3());
    named.group.position.add(new THREE.Vector3(x,y,0).unproject(camera).sub(head));
    nameplate.update(camera,402,652);
  };
  placeHead(.97);
  requireThat(sprite.visible && sprite.center.x > .5,"画面右端の名前を画面内へ寄せる");
  placeHead(-.97);
  requireThat(sprite.visible && sprite.center.x < .5,"画面左端の名前を画面内へ寄せる");
  placeHead(1.12);
  requireThat(!sprite.visible,"画面外の人物の名前は表示しない");
  placeHead(0,.99);
  requireThat(sprite.visible && sprite.center.y > 0,"会話相手の名札は上端で切れない");
  const patrol = stage.setRoom("Q02");
  createCastleRoomNameplates(story,[],patrol);
  requireThat(patrol._inspect.westGuard.charObj.headPivot.children.some(node => node.isSprite && node.name === "西番"),
    "西番に、流用モデルの名前が出ない");

  for (const [room,model] of [["C01","PROP_THRONE"],["G01","PROP_HERON"],["N03","PROP_ASTRO"],
      ["N06","PROP_ASTRO"],["Q03","PROP_STATUE"],["Q05","PROP_BOUNDARY"]]) {
    const ctrl = stage.setRoom(room);
    const area = ctrl?.env ?? map.createEnvironment(room);
    const root = ctrl?.root ?? area.group;
    let count = 0;
    root.traverse(node => { if (node.name === model && node.visible) count++; });
    requireThat(count === 1,room+" に "+model+" が1つ置かれる");
    if (!ctrl) disposeCastleStage({root});
  }

  for (const item of CASTLE_DATA.items) {
    const room = story.main.get(item.found).room;
    const ctrl = stage.setRoom(room,{itemState:"hidden"});
    const prop = ctrl._inspect.props.item ?? ctrl._inspect.props[item.id.toLowerCase()];
    requireThat(prop?.id === item.id,room+" の重要品は "+item.id);
    requireThat(ctrl.config.variants.some(variant => variant.id === CASTLE_STAGE_EFFECTS[item.found]),
      room+" の重要品は通常プレイで演出が再生される");
    if (["W02","S02","E03","W03"].includes(room)) {
      requireThat(!prop.group.visible,room+" の仕掛けに隠れた品は取得前の探索で露出しない");
    }
    stage.restore({itemState:"acquired"});
    requireThat(!prop.group.visible,room+" の重要品は取得後に元の場所へ残らない");
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
console.log("全59地点の通路、36人の配置、重要品13点と主要ギミックの配置を確認。");
