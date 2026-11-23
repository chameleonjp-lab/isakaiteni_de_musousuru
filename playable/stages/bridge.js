"use strict";

const CASTLE_STAGE_LIBRARIES = [
  [window.CastleEscapeStage1, "STAGE1_CONFIG"],
  [window.CastleEscapeStage2, "STAGE2_CONFIG"],
  [window.CastleEscapeStage3, "STAGE3_CONFIG"]
];

const CASTLE_STAGE_EFFECTS = {
  M01: "call1Bow", M02: "call2Raise", M06: "bothSlots", M08: "rodAndPass",
  M12: "bothPlaced", M16: "reserveSuccess", M17: "success", M18: "emptyShift",
  M19: "success", M20: "clearSuccess", E002: "earlyRaiseWarn",
  E152: "noSaluteClosed", "E152.A": "saluteOpenGrate", "E152.B": "noSaluteClosed",
  E264: "handoff", E269: "inspectE269", E274: "listenE274", E278: "cloakCaughtE278", E280: "plainCaughtE280"
};

function castleStageState(story, run) {
  const w = run.world;
  const has = id => w.main.includes(id);
  const room = w.room;
  const item = CASTLE_DATA.items.find(item => story.main.get(item.found)?.room === room);
  const acquired = !!item && has(item.found);
  const collarRemoved = story.collarOff(w);
  return {
    room,
    hasKey: has("M08"),
    hasWeight: has("M13") && !has("M19"),
    collarRemoved,
    audienceStep: has("M02") ? 2 : has("M01") ? 1 : 0,
    reserved: has("M16"),
    stopPulled: collarRemoved,
    doors: { W04Open: !collarRemoved && has("M16"), Q02Open: has("M17") },
    guardPresent: !has("M18"),
    detected: w.seen,
    detectedAfterRemoval: w.seen,
    weightInserted: has("M19"),
    floorOpen: has("M19"),
    passedRoyalEntranceThisRun: has("M19"),
    escaped: w.escaped,
    acquired,
    itemState: acquired ? "acquired" : "hidden",
    boxOpen: acquired,
    puzzleSolved: acquired,
    grateOpen: w.choices.E152?.at(-1) === "A"
  };
}

function disposeCastleStage(ctrl) {
  const resources = new Set();
  ctrl.root.traverse(node => {
    if (node.geometry) resources.add(node.geometry);
    if (!node.material) return;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture && !value.castleShared) resources.add(value);
      }
    }
  });
  ctrl.root.parent?.remove(ctrl.root);
  ctrl.dispose?.();
  for (const resource of resources) resource.dispose();
}

function createCastleStage() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161924);
  scene.add(new THREE.HemisphereLight(0xeef2ff, 0x353845, 0.95));
  const light = new THREE.DirectionalLight(0xfff1d6, 1.3);
  light.position.set(5, 11, 6);
  scene.add(light);

  let ctrl;
  let animation;
  let room;

  function cancel() {
    const pending = animation;
    animation = null;
    if (pending?.done) pending.done(false);
  }

  function setRoom(id, snapshot) {
    if (room !== id) {
      cancel();
      if (ctrl) disposeCastleStage(ctrl);
      const entry = CASTLE_STAGE_LIBRARIES.find(([stage, key]) => Object.hasOwn(stage[key], id));
      ctrl = entry?.[0].createSceneController(id, { scene });
      room = id;
    }
    if (ctrl && snapshot) restore(snapshot);
    return ctrl;
  }

  function restore(snapshot) {
    cancel();
    ctrl.setExternalFlags?.(snapshot);
    ctrl.setVariant(ctrl.config.variants[0].id);
    ctrl.applyGameState(snapshot);
  }

  function play(variant, done) {
    if (!ctrl) return false;
    variant ||= ctrl.config.variants[0].id;
    if (!ctrl.config.variants.some(v => v.id === variant)) return false;
    cancel();
    ctrl.setVariant(variant);
    ctrl.play();
    animation = { time: 0, duration: ctrl.getTotalDuration(), done, variant };
    return true;
  }

  function update(dt, time) {
    if (!ctrl) return;
    ctrl.update(dt, time);
    if (!animation) return;
    animation.time += dt;
    if (animation.time < animation.duration) return;
    const completed = animation;
    animation = null;
    return () => completed.done?.(completed.variant !== "clearSuccess" || ctrl?.hasCleared());
  }

  return { scene, setRoom, restore, play, cancel, update };
}

function placeCastleStageCamera(camera, preset, offset = 0, zoom = 1, pitchOffset = 0) {
  const dx = preset.pos[0] - preset.look[0];
  const dy = preset.pos[1] - preset.look[1];
  const dz = preset.pos[2] - preset.look[2];
  const distance = Math.hypot(dx, dy, dz);
  const yaw = Math.atan2(dx, dz) + offset;
  const pitch = Math.atan2(dy, Math.hypot(dx, dz)) + pitchOffset;
  camera.position.set(
    preset.look[0] + Math.sin(yaw) * Math.cos(pitch) * distance * zoom,
    preset.look[1] + Math.sin(pitch) * distance * zoom,
    preset.look[2] + Math.cos(yaw) * Math.cos(pitch) * distance * zoom
  );
  camera.lookAt(...preset.look);
}
