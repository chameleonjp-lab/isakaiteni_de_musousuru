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

const walkRadius = .22;

function castleObstacles(root) {
  root.updateMatrixWorld(true);
  const obstacles = [];
  root.traverseVisible(node => {
    const shape = node.userData.walkObstacle;
    if (!shape) return;
    if (shape === "actor") {
      const center = node.getWorldPosition(new THREE.Vector3());
      obstacles.push((x,z,floor) => Math.abs(center.y - floor) < 1 &&
        Math.hypot(x - center.x, z - center.z) < .23 + walkRadius);
      return;
    }
    const bounds = new THREE.Box3();
    const part = new THREE.Box3();
    node.traverseVisible(mesh => {
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      bounds.union(part.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
    });
    if (bounds.isEmpty()) return;

    const { min, max } = bounds;
    if (shape === "oriented") {
      const inverse = node.matrixWorld.clone().invert();
      const local = node.geometry.boundingBox;
      const point = new THREE.Vector3();
      obstacles.push((x,z,floor) => {
        if (max.y < floor + .16 || min.y > floor + 1.26) return false;
        point.set(x, floor, z).applyMatrix4(inverse);
        return point.x > local.min.x - walkRadius && point.x < local.max.x + walkRadius &&
          point.z > local.min.z - walkRadius && point.z < local.max.z + walkRadius;
      });
      return;
    }

    const round = shape === "round" || shape === "water";
    const cx = (min.x + max.x) / 2, cz = (min.z + max.z) / 2;
    const rx = (max.x - min.x) / 2 + walkRadius, rz = (max.z - min.z) / 2 + walkRadius;
    obstacles.push((x,z,floor) => {
      if (shape !== "water" && (max.y < floor + .16 || min.y > floor + 1.26)) return false;
      if (x <= min.x - walkRadius || x >= max.x + walkRadius ||
          z <= min.z - walkRadius || z >= max.z + walkRadius) return false;
      return !round || ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 < 1;
    });
  });
  return obstacles;
}

function castleWalkable(area, x, z) {
  const { spec, corridorPortals, obstacles } = area;
  const inRoom = Math.abs(x) <= spec.w / 2 - .13 && Math.abs(z) <= spec.dLen / 2 - .13;
  if (!inRoom && !corridorPortals.some(portal => {
    const { depth, across } = castlePassage(portal, x, z);
    return depth >= -.35 && depth <= (portal.barrier.visible ? .04 : portal.length) &&
      Math.abs(across) <= portal.width / 2 - walkRadius;
  })) return false;
  const floor = area.surfaceY?.(x,z) ?? 0;
  return !obstacles?.some(blocks => blocks(x,z,floor));
}

function castleMove(area, position, dx, dz) {
  // Stay on the near side of thin solids even in a slow frame.
  const steps = Math.ceil(Math.hypot(dx, dz) / .12);
  for (let i = 0; i < steps; i++) {
    const x = position.x + dx / steps;
    const z = position.z + dz / steps;
    if (castleWalkable(area, x, position.z)) position.x = x;
    if (castleWalkable(area, position.x, z)) position.z = z;
  }
}

function castleSafePosition(area, x, z) {
  const safe = (x,z) => castleWalkable(area,x,z) && (area.spec.id !== "Q05" || z > 0);
  if (safe(x,z)) return {x,z};
  // Old saves may be on a solid. Scan the room for the nearest usable floor.
  let nearest;
  let best = Infinity;
  for (let testZ = -area.spec.dLen / 2 + .5; testZ < area.spec.dLen / 2; testZ += .25) {
    for (let testX = -area.spec.w / 2 + .5; testX < area.spec.w / 2; testX += .25) {
      const distance = (testX - x) ** 2 + (testZ - z) ** 2;
      if (distance >= best || !safe(testX,testZ)) continue;
      nearest = {x:testX,z:testZ};
      best = distance;
    }
  }
  return nearest;
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
