"use strict";

(() => {
  const story = createStory(CASTLE_DATA);
  const $ = id => document.getElementById(id);
  const routeRooms = [...new Set([...story.main.values()].map(step => step.room))];
  routeRooms.splice(routeRooms.indexOf("Q05"), 0, "Q04");
  const optionalRooms = ["E07", "S04"];
  const sampleRooms = [...routeRooms, ...optionalRooms];
  const saveKey = "ou-to-escape-scene-check-v1";
  const proof = { M10: "cloak", M18: "white-lily", M20: CASTLE_DATA.escape.boundary_event };
  const failedChoices = {
    M01: { earlyRaiseWarn: "E002" },
    M18: { cloakCaughtE278: "E278", plainCaughtE280: "E280" }
  };
  const practiceChoices = {
    M06: ["singleSlotFail"], M08: ["rodOnlyFail"], M12: ["oneOnlyFail"],
    M16: ["wrongOrientation", "missingItems"], M17: ["doorOpen", "noKey"],
    M18: ["guardPresent"], M19: ["wrongStatue", "noWeight"], M20: ["stopBeforeStone"]
  };

  let run = story.fresh();
  let passedDrain = false;
  try {
    const stored = JSON.parse(localStorage.getItem(saveKey));
    if (story.validSave(stored?.run)) {
      run = stored.run;
      passedDrain = Boolean(stored.passedDrain && run.world.main.includes("M19"));
    }
  } catch { /* Continue with a fresh run. */ }

  let sample = false;
  let ctrl;
  let stage;
  let notice = "";
  let selected = "";
  let busy = false;
  let debug = false;
  let cameraMode = "wide";
  let zoom = 1;
  let yaw = 0;
  let pitch = 0;
  const canvas = $("scene-canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    stage = createCastleStage();
  } catch {
    $("status-text").textContent = "この環境では3D演出を表示できません。";
    document.querySelectorAll("button").forEach(button => { button.disabled = true; });
    return;
  }
  const camera = new THREE.PerspectiveCamera(48, 1, .05, 150);

  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify({ run, passedDrain })); }
    catch { /* Continue without persistence. */ }
  }

  function walk(target, state = run) {
    for (const next of story.routeTo(state, target).slice(1)) {
      if (!story.move(state, next)) return false;
    }
    return state.world.room === target;
  }

  function start(target) {
    stage.setRoom(null);
    sample = false;
    run = story.fresh();
    passedDrain = false;
    if (target === "W04") {
      for (const [id, mission] of story.main) {
        if (id === "M16") break;
        if (!walk(mission.room) || !story.completeMain(run, id, proof[id])) break;
      }
      walk(target);
    }
    save();
    show(run.world.room);
  }

  function allowed(room) {
    if (sample) return true;
    if (run.failure || run.world.escaped) return false;
    if (room === "Q05" && !passedDrain) return false;
    return story.routeTo(run, room).length > 0;
  }

  function show(room) {
    busy = false;
    notice = "";
    selected = "";
    ctrl = stage.setRoom(room, sample ? null : castleStageState(story, run));
    if (sample) ctrl.setVariant(ctrl.config.variants[0].id);
    ctrl.setDebugVisible(debug);
    setCamera("wide");
    renderControls();
  }

  function move(room) {
    if (!allowed(room)) return;
    if (!sample && !walk(room)) {
      save();
      show(run.world.room);
      return;
    }
    if (!sample) save();
    show(room);
  }

  function options() {
    const config = ctrl.config.variants;
    if (sample) return config;
    if (run.failure || run.world.escaped) return [];
    const active = [...story.main.keys()].find(id => story.canMain(run, id));
    if (active) {
      const success = CASTLE_STAGE_EFFECTS[active] || config[0].id;
      const available = new Set([success, ...Object.keys(failedChoices[active] || {}), ...(practiceChoices[active] || [])]);
      return config.filter(x => available.has(x.id));
    }
    if (ctrl.id === "Q04") return config;
    if (ctrl.id === "S04") return config;
    if (ctrl.id === "E07") return config;
    return [];
  }

  function button(text, click, active) {
    const b = document.createElement("button");
    b.textContent = text;
    b.type = "button";
    b.classList.toggle("active", active);
    b.addEventListener("click", click);
    return b;
  }

  function renderControls() {
    const available = options();
    if (!available.some(x => x.id === selected)) {
      const mission = [...story.main.keys()].find(id => story.canMain(run, id));
      const first = sample ? null : CASTLE_STAGE_EFFECTS[mission];
      selected = available.find(x => x.id === first)?.id || available[0]?.id || "";
    }
    $("scene-tabs").hidden = !sample;
    if (sample) $("scene-tabs").replaceChildren(...sampleRooms.map(room => button(room, () => move(room), room === ctrl.id)));
    $("variant-row").replaceChildren(...available.map(v => {
      const b = button(v.label, () => play(v.id), selected === v.id);
      b.dataset.variant = v.id;
      return b;
    }));
    $("scene-badge").textContent = ctrl.id;
    const runLabel = run.world.escaped ? "脱出成功" : run.failure ? "発見・失敗。死に戻りで再開できます" : story.collarOff(run.world) ? "首輪なし" : "首輪あり";
    $("run-summary").textContent = sample ? "演出見本｜どの場面も自由に再生できます" :
      runLabel + "｜" + run.world.main.length + "/20 行程｜経過 " + run.world.minutes + " 分";
    const next = nextRoom();
    const canLeave = sample || (next && allowed(next) &&
      ![...story.main.keys()].some(id => story.canMain(run, id)) &&
      (ctrl.id !== "Q04" || passedDrain));
    $("btn-next").disabled = busy || !canLeave;
    $("btn-death").hidden = sample;
    $("btn-death").disabled = !run.failure;
    $("btn-play").disabled = !selected || busy;
    $("btn-reset").disabled = !sample && !!run.failure;
    for (const b of $("variant-row").children) b.disabled = busy;
    $("btn-mode-run").classList.toggle("active", !sample);
    $("btn-mode-sample").classList.toggle("active", sample);
    $("btn-door").hidden = ctrl.id !== "Q01";
    $("btn-optional-east").hidden = sample;
    $("btn-optional-south").hidden = sample;
    $("btn-optional-east").disabled = busy || !allowed("E07");
    $("btn-optional-south").disabled = busy || !allowed("S04");
  }

  function nextRoom() {
    if (sample) return sampleRooms[(sampleRooms.indexOf(ctrl.id) + 1) % sampleRooms.length];
    const at = routeRooms.indexOf(ctrl.id);
    if (at >= 0) return routeRooms[at + 1];
    const unfinished = [...story.main.values()].find(mission => !run.world.main.includes(mission.id));
    return unfinished?.room;
  }

  function applyResult(id) {
    const main = [...story.main.keys()].find(step => story.canMain(run, step));
    const failure = failedChoices[main]?.[id];
    if (failure) story.playSide(run, failure);
    else if (main && id === (CASTLE_STAGE_EFFECTS[main] || ctrl.config.variants[0].id)) {
      story.completeMain(run, main, proof[main]);
    } else if (ctrl.id === "Q04" && id === "passToQ05") passedDrain = true;
    else if (ctrl.id === "S04") {
      if (!story.has(run, "E151")) story.playSide(run, "E151");
      story.playSide(run, "E152", id === "saluteOpenGrate" ? "E152.A" : "E152.B");
    }
    save();
    if (run.failure) notice = run.failure.heading + "。死に戻りで再開できます。";
    if (run.world.escaped) notice = "草地に着き、脱出に成功しました。";
  }

  function play(id) {
    if (!id || busy || !options().some(x => x.id === id)) return;
    selected = id;
    notice = "";
    busy = true;
    if (!stage.play(id, success => {
      busy = false;
      if (!sample && success) applyResult(id);
      renderControls();
    })) busy = false;
    renderControls();
  }

  function setCamera(mode) {
    cameraMode = mode;
    yaw = pitch = 0;
    zoom = 1;
    $("btn-wide").classList.toggle("active", mode === "wide");
    $("btn-close").classList.toggle("active", mode === "closeup");
    $("btn-door").classList.toggle("active", mode === "doorClose");
  }

  $("btn-start-c01").onclick = () => start("C01");
  $("btn-start-w04").onclick = () => start("W04");
  $("btn-mode-run").onclick = () => {
    if (!sample) return;
    stage.setRoom(null);
    sample = false;
    show(run.world.room);
  };
  $("btn-mode-sample").onclick = () => {
    if (sample) return;
    stage.setRoom(null);
    sample = true;
    show(run.world.room);
  };
  $("btn-next").onclick = () => move(nextRoom());
  $("btn-optional-east").onclick = () => move("E07");
  $("btn-optional-south").onclick = () => move("S04");
  $("btn-play").onclick = () => play(selected);
  $("btn-reset").onclick = () => { stage.setRoom(null); show(ctrl.id); };
  $("btn-death").onclick = () => {
    if (!story.rewind(run)) return;
    stage.setRoom(null);
    passedDrain = false;
    save();
    show(run.world.room);
  };
  $("btn-wide").onclick = () => setCamera("wide");
  $("btn-close").onclick = () => setCamera("closeup");
  $("btn-door").onclick = () => setCamera("doorClose");
  $("btn-dbg").onclick = () => {
    debug = !debug;
    $("btn-dbg").classList.toggle("active", debug);
    ctrl.setDebugVisible(debug);
  };
  $("btn-zin").onclick = () => { zoom = Math.max(.4, zoom * .82); };
  $("btn-zout").onclick = () => { zoom = Math.min(4, zoom * 1.22); };

  let pointer;
  let lastX;
  let lastY;
  canvas.onpointerdown = e => {
    if (e.button !== 0) return;
    pointer = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(pointer);
  };
  canvas.onpointermove = e => {
    if (e.pointerId !== pointer) return;
    yaw -= (e.clientX - lastX) * .007;
    pitch = Math.max(-.45, Math.min(.45, pitch + (e.clientY - lastY) * .006));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  canvas.onlostpointercapture = () => { pointer = undefined; };

  function resize() {
    const box = $("stage-wrap");
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
    renderer.setSize(box.clientWidth, box.clientHeight, false);
    camera.aspect = box.clientWidth / Math.max(1, box.clientHeight);
    camera.updateProjectionMatrix();
  }

  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (now - last < 33) return;
    const dt = Math.min(.08, (now - last) / 1000);
    last = now;
    const completed = stage.update(dt, now / 1000);
    placeCastleStageCamera(camera, ctrl.getCameraPreset(cameraMode), yaw, zoom, pitch);
    renderer.render(stage.scene, camera);
    completed?.();
    $("status-text").textContent = notice || ctrl.getStatusText();
  }

  window.addEventListener("resize", resize);
  resize();
  show(run.world.room);
  requestAnimationFrame(tick);
})();
