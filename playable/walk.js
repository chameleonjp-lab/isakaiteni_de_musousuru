"use strict";

const walkingKeys = new Map([
  ["ArrowLeft", [-1, 0]], ["KeyA", [-1, 0]], ["ArrowRight", [1, 0]], ["KeyD", [1, 0]],
  ["ArrowUp", [0, -1]], ["KeyW", [0, -1]], ["ArrowDown", [0, 1]], ["KeyS", [0, 1]]
]);

function castlePassage(portal, x, z) {
  const dx = x - portal.entryX;
  const dz = z - portal.entryZ;
  return { depth: dx * portal.dirX + dz * portal.dirZ, across: dx * portal.dirZ - dz * portal.dirX };
}

function castleWalkable(area, x, z) {
  const { spec, corridorPortals, obstacles } = area;
  if (obstacles?.some(box => x > box.min.x - .2 && x < box.max.x + .2 &&
    z > box.min.z - .2 && z < box.max.z + .2)) return false;
  if (spec.id === "Q05" && Math.abs(x) < .74 && Math.abs(z) < .5) return false;
  if (Math.abs(x) <= spec.w / 2 - .13 && Math.abs(z) <= spec.dLen / 2 - .13) return true;
  return corridorPortals.some(portal => {
    const { depth, across } = castlePassage(portal, x, z);
    return depth >= -.35 && depth <= (portal.barrier.visible ? .04 : portal.length) &&
      Math.abs(across) <= portal.width / 2 - .22;
  });
}

function createCastleWalk(stick) {
  let activePointer = null;
  let joyX = 0;
  let joyZ = 0;
  const keys = new Set();

  function setStick(event) {
    const rect = stick.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / 28;
    const z = (event.clientY - rect.top - rect.height / 2) / 28;
    const scale = Math.max(1, Math.hypot(x, z));
    joyX = x / scale;
    joyZ = z / scale;
    stick.style.setProperty("--stick-x", `${joyX * 24}px`);
    stick.style.setProperty("--stick-y", `${joyZ * 24}px`);
  }
  function releaseStick() {
    const pointer = activePointer;
    activePointer = null;
    if (pointer !== null && stick.hasPointerCapture(pointer)) stick.releasePointerCapture(pointer);
    joyX = joyZ = 0;
    stick.style.removeProperty("--stick-x");
    stick.style.removeProperty("--stick-y");
  }
  function reset() {
    releaseStick();
    keys.clear();
  }
  stick.addEventListener("pointerdown", event => {
    if (activePointer !== null || event.button !== 0 || stick.disabled) return;
    event.preventDefault();
    stick.setPointerCapture(event.pointerId);
    activePointer = event.pointerId;
    setStick(event);
  });
  stick.addEventListener("pointermove", event => {
    if (event.pointerId === activePointer) setStick(event);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    stick.addEventListener(name, event => {
      if (event.pointerId === activePointer) releaseStick();
    });
  }
  window.addEventListener("keydown", event => {
    if (stick.hidden || stick.disabled || event.altKey || event.ctrlKey || event.metaKey ||
      !walkingKeys.has(event.code) || event.target.closest("dialog, input, textarea, select, [contenteditable]")) return;
    event.preventDefault();
    keys.add(event.code);
  });
  window.addEventListener("keyup", event => keys.delete(event.code));
  window.addEventListener("blur", reset);

  return {
    reset,
    vector() {
      let x = joyX;
      let z = joyZ;
      for (const [dx, dz] of new Set([...keys].map(code => walkingKeys.get(code)))) {
        x += dx;
        z += dz;
      }
      const scale = Math.max(1, Math.hypot(x, z));
      return [x / scale, z / scale];
    }
  };
}
