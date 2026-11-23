"use strict";

function createCastleView(canvas, frame, actions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(48, 1, .05, 150);
  const stage3D = createCastleStage();
  const environmentApi = window.CastleEscapeEnvironments;
  const boundary = window.CastleEscapeStage2.STAGE2_CONFIG.Q05;
  const models = window.CastleEscapeModels;
  const player = models.createCharacter("P00", {});
  if (player.mainProp) player.mainProp.visible = false;
  stage3D.scene.add(player.group);

  const stick = frame.querySelector("#walk-stick");
  const passage = frame.querySelector("#walk-passage");
  const closeView = frame.querySelector("#stage-close");
  const doorView = frame.querySelector("#stage-door");
  const input = createCastleWalk(stick);
  const lookTarget = new THREE.Vector3();
  const position = { x: 0, z: 0, facing: Math.PI, yaw: 0, pitch: .36 };
  let area;
  let plainArea;
  let controller;
  let snapshotKey;
  let current;
  let run;
  let cameraMode = "wide";
  let contextLost = false;
  let playing = false;
  let dragging = null;
  let dragX, dragY;
  let orbitYaw = 0;
  let crossed = false;
  let lastSaved = 0;
  let positionDirty = false;
  let walked = false;
  let walkCycle = 0;
  let savedPosition = actions.initialPosition;

  const available = () => !contextLost;
  const walking = () => available() && run?.world.main.includes("M02") && !run.world.escaped && !run.failure;
  const freeCamera = () => walking() && cameraMode === "wide" && !playing;

  function stopInput() {
    input.reset();
    const pointer = dragging;
    dragging = null;
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  }

  function updateControls() {
    const exploring = walking();
    frame.dataset.explore = String(exploring);
    closeView.hidden = !controller;
    doorView.hidden = current !== "Q01";
    closeView.setAttribute("aria-pressed", String(cameraMode === "closeup"));
    doorView.setAttribute("aria-pressed", String(cameraMode === "doorClose"));
    stick.hidden = !exploring;
    stick.disabled = playing;
    if (!freeCamera()) passage.hidden = true;
    if (controller?._inspect?.hero) controller._inspect.hero.rig.visible = !freeCamera();
    player.group.visible = Boolean(freeCamera());
  }

  function selectCamera(mode) {
    cameraMode = cameraMode === mode ? "wide" : mode;
    orbitYaw = 0;
    stopInput();
    updateControls();
  }

  closeView.addEventListener("click", () => selectCamera("closeup"));
  doorView.addEventListener("click", () => selectCamera("doorClose"));

  function spawn(from, restore) {
    const entry = area.corridorPortals.find(portal => portal.targetId === from);
    const defaults = { x: 0, z: current === "C01" ? 2.8 : ["Q02", "Q05"].includes(current) ? 6 : 0, yaw: 0 };
    if (entry) {
      defaults.x = entry.entryX - entry.dirX * 1.05;
      defaults.z = entry.entryZ - entry.dirZ * 1.05;
      defaults.yaw = Math.atan2(entry.dirX, entry.dirZ);
    }
    const validRestore = restore?.room === current && [restore.x, restore.z, restore.yaw].every(Number.isFinite) &&
      Math.abs(restore.x) < area.spec.w && Math.abs(restore.z) < area.spec.dLen &&
      (current !== "Q05" || restore.z > 0);
    const next = validRestore ? restore : defaults;
    const safe = castleSafePosition(area, next.x, next.z);
    position.x = safe.x;
    position.z = safe.z;
    position.yaw = next.yaw;
    position.facing = next.yaw + Math.PI;
    position.pitch = .36;
    crossed = false;
    positionDirty = false;
    walked = false;
    walkCycle = 0;
  }

  function setRoom(room, nextRun, { from, reset = false } = {}) {
    const previousRun = run;
    run = nextRun;
    const snapshot = castleStageState(story, run);
    const nextKey = JSON.stringify([snapshot, run.failure?.event, run.fails]);
    const changed = room.id !== current;
    const stateChanged = nextKey !== snapshotKey || run !== previousRun || reset;
    if (stateChanged) {
      playing = false;
      controller = stage3D.setRoom(room.id, snapshot);
      snapshotKey = nextKey;
    }
    if (changed) {
      if (plainArea) disposeCastleStage({ root: plainArea.group });
      plainArea = controller ? null : environmentApi.createEnvironment(room.id);
      if (plainArea) stage3D.scene.add(plainArea.group);
      area = controller?.env || plainArea;
      current = room.id;
      area.surfaceY = controller?._inspect?.getSurfaceY ?? controller?._inspect?.getStairSurfaceY;
      stage3D.scene.background.setHex(area.theme.bg);
      stage3D.scene.fog = new THREE.FogExp2(area.theme.fog, area.theme.fogDensity);
    }
    for (const portal of area.corridorPortals) {
      const open = story.canMove(run.world, portal.targetId);
      portal.barrier.visible = !open;
      portal.hitMeshes[1].visible = false;
    }
    if (changed || stateChanged) area.obstacles = castleObstacles(controller?.root || area.group);
    if (changed || reset || run !== previousRun) {
      if (!from) stopInput();
      spawn(from, !reset && savedPosition);
      savedPosition = null;
      cameraMode = "wide";
      orbitYaw = 0;
    } else if (stateChanged && !castleWalkable(area, position.x, position.z)) {
      Object.assign(position, castleSafePosition(area, position.x, position.z));
      positionDirty = true;
    }
    if (player.collarMesh) player.collarMesh.visible = !snapshot.collarRemoved;
    updateControls();
  }

  function walkingPosition(room) {
    if (room !== current || !walking() || (room === "Q05" && position.z <= 0)) return null;
    return { room, x: position.x, z: position.z, yaw: position.yaw };
  }

  const size = new ResizeObserver(() => {
    camera.aspect = Math.max(1, frame.clientWidth) / Math.max(1, frame.clientHeight);
    camera.fov = camera.aspect < 1.25 ? 54 : 48;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
    renderer.setSize(frame.clientWidth, frame.clientHeight, false);
    camera.updateProjectionMatrix();
  });
  size.observe(frame);

  canvas.addEventListener("pointerdown", event => {
    if (dragging !== null || event.button !== 0 || actions.isBlocked()) return;
    canvas.setPointerCapture(event.pointerId);
    dragging = event.pointerId;
    dragX = event.clientX;
    dragY = event.clientY;
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerId !== dragging) return;
    const yawDelta = (event.clientX - dragX) * .007;
    if (freeCamera()) {
      position.yaw -= yawDelta;
      position.pitch = Math.max(.13, Math.min(.79, position.pitch + (event.clientY - dragY) * .005));
      positionDirty = true;
    } else orbitYaw = Math.max(-.45, Math.min(.45, orbitYaw - yawDelta));
    dragX = event.clientX;
    dragY = event.clientY;
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(name, event => {
      if (event.pointerId === dragging) {
        dragging = null;
        flushPosition();
      }
    });
  }
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    contextLost = true;
    stopInput();
    playing = false;
    stage3D.cancel();
    frame.classList.add("unavailable");
    actions.modeChanged();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    frame.classList.remove("unavailable");
    actions.modeChanged();
  });

  function flushPosition() {
    if (!positionDirty) return;
    positionDirty = false;
    actions.savePosition();
  }

  function updateWalk(dt, now, [x, z]) {
    const sin = Math.sin(position.yaw), cos = Math.cos(position.yaw);
    const dx = x * cos + z * sin;
    const dz = z * cos - x * sin;
    const length = Math.hypot(dx, dz);
    const prevX = position.x, prevZ = position.z;
    const speed = 4.6;
    if (length > .055) {
      castleMove(area, position, dx * speed * dt, dz * speed * dt);
      const target = Math.atan2(dx, dz);
      const diff = target - position.facing;
      position.facing += Math.atan2(Math.sin(diff), Math.cos(diff)) * Math.min(1, dt * 12);
    }

    const moved = position.x !== prevX || position.z !== prevZ;
    if (moved) {
      positionDirty = true;
      walkCycle += dt * Math.max(.35, length) * 2.45;
      if (current === "Q05") {
        if (position.z > boundary.boundaryZ) crossed = false;
        else if (prevZ > boundary.boundaryZ) crossed = true;
        if (crossed && position.z <= boundary.grassConfirmZ && actions.escape()) return;
      }
      if (current === "Q02" && Math.abs(position.x) < 1.9 && position.z < 4 && position.z > -5.5 &&
        actions.exposed()) return;
    }

    let near;
    for (const portal of area.corridorPortals) {
      const { depth, across } = castlePassage(portal, position.x, position.z);
      if (depth < -1.3 || Math.abs(across) > portal.width / 2) continue;
      near = portal;
      if (moved && !portal.barrier.visible && depth >= portal.length - .48 && actions.move(portal.targetId)) return;
    }
    const label = near ? (near.barrier.visible ? "閉鎖　" : "") + near.targetName : "";
    if (passage.textContent !== label) passage.textContent = label;
    passage.hidden = !label;
    if ((moved && now - lastSaved > 750) || (!moved && walked)) {
      lastSaved = now;
      flushPosition();
    }
    walked = moved;
  }

  function drawWalk() {
    const floor = controller?._inspect?.getSurfaceY?.(position.x, position.z) ??
      controller?._inspect?.getStairSurfaceY?.(position.x, position.z) ?? 0;
    models.applyPose(player, walked ? "walk" : "stand", walkCycle);
    player.group.position.set(position.x, floor, position.z);
    player.group.rotation.y = position.facing;

    const fX = Math.sin(position.yaw), fZ = Math.cos(position.yaw);
    const followDistance = camera.aspect < .8 ? 3.6 : 2.55;
    const desired = followDistance * Math.cos(position.pitch);
    let distance = 0;
    for (let step = .2; step <= desired; step += .2) {
      if (!castleWalkable(area, position.x + fX * step, position.z + fZ * step)) break;
      distance = step;
    }
    camera.position.set(position.x + fX * distance, floor + 1.62 + Math.sin(position.pitch) * 2.4,
      position.z + fZ * distance);
    lookTarget.set(position.x - fX * .9, floor + 1.28, position.z - fZ * .9);
    camera.lookAt(lookTarget);
  }

  let last = 0;
  let animation;
  function draw(now) {
    animation = 0;
    if (document.hidden) return;
    animation = requestAnimationFrame(draw);
    if (!run || contextLost || now - last < 30) return;
    const dt = Math.min(.09, (now - last) / 1000);
    last = now;
    if (walking() && !playing) {
      const drive = actions.isBlocked() ? [0, 0] : input.vector();
      if (cameraMode !== "wide" && Math.hypot(...drive) > .055) {
        cameraMode = "wide";
        updateControls();
      }
      if (freeCamera()) updateWalk(dt, now, drive);
    }
    if (freeCamera()) drawWalk();
    else if (controller) {
      const preset = controller.getCameraPreset(cameraMode);
      placeCastleStageCamera(camera, preset, orbitYaw);
    } else {
      camera.position.set(3, 3, 4);
      camera.lookAt(0, 1, 0);
    }
    if (plainArea) plainArea.update(now / 1000);
    const completed = stage3D.update(dt, now / 1000);
    renderer.render(stage3D.scene, camera);
    completed?.();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushPosition();
      stopInput();
      cancelAnimationFrame(animation);
      animation = 0;
    } else if (!animation) animation = requestAnimationFrame(draw);
  });
  window.addEventListener("pagehide", flushPosition);
  animation = requestAnimationFrame(draw);

  function play(variant, done) {
    if (contextLost || !stage3D.play(variant, complete => {
      playing = false;
      if (variant !== "clearSuccess") {
        stage3D.restore(castleStageState(story,run));
        area.obstacles = castleObstacles(controller.root);
      }
      updateControls();
      done?.(complete);
    })) return false;
    stopInput();
    playing = true;
    orbitYaw = 0;
    updateControls();
    return true;
  }

  return { setRoom, play, available, stopInput, walkingPosition };
}
