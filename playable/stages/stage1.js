/**
 * 王都からの脱出 — 第1段階：終盤3場面（Q01 / Q02 / Q03）3D演出・状態連動モジュール v3
 * 依存: Three.js r128, CastleEscapeModels (models_characters_v3_latest.js),
 *       CastleEscapeItems (models_items_props_v2_latest.js),
 *       CastleEscapeEnvironments (models_environments_v3_latest.js)
 *
 * 使い方（ゲーム本体からの呼び出し例）:
 *   const ctrl = window.CastleEscapeStage1.createSceneController("Q01", { scene, envMap });
 *   ctrl.applyGameState({
 *     hasKey: true, collarRemoved: false, doors: { W04Open: true, Q02Open: false }
 *   });
 *   ctrl.setVariant("success");
 *   ctrl.play();
 *   ctrl.update(dt, elapsedSec);
 *   ctrl.reset();
 *   ctrl.dispose();
 */
(function (global) {
  "use strict";

  function getCharApi() {
    const api = global.CastleEscapeModels || global.CastleEscapeCharacters;
    if (!api || typeof api.createCharacter !== "function") {
      throw new Error("CastleEscapeModels (models_characters_v3_latest.js) が読み込まれていません。");
    }
    return api;
  }

  // =========================================================================
  // 単一座標定義（見た目・操作位置・カメラ・階段・位置確認表示すべてここから参照）
  // =========================================================================
  const STAGE1_CONFIG = {
    Q01: {
      missionId: "M17",
      title: "Q01 無音祈祷室／M17「首輪を外す」",
      roomSize: { w: 8.8, d: 8.8, h: 5.8 },
      altarPos: [0, 0.55, -2.4],
      doors: {
        W04: { targetId: "W04", fallbackX: -4.4, fallbackZ: 1.65, width: 2.24, height: 3.2 },
        Q02: { targetId: "Q02", fallbackX: -4.4, fallbackZ: -1.65, width: 2.24, height: 3.2 }
      },
      heroPath: {
        enter: [-3.2, 1.65],
        doorHandle: [-3.45, 1.25],
        unlock: [-0.9, 0.2],
        toQ02: [-3.2, -1.65]
      },
      collarWorldY: 1.62,
      keyTargetLength: 0.12,
      timings: {
        walkToDoor: 0.45,
        reachHandle: 0.25,
        closeDoor: 0.70,
        releaseHandle: 0.20,
        walkToUnlock: 0.75,
        insertKey: 0.60,
        turnKey: 0.35,
        openCollar: 0.45,
        removeCollar: 0.50,
        stow: 0.60,
        walkToQ02: 0.85
      },
      cameras: {
        wide: { pos: [3.1, 3.5, 4.1], look: [-1.2, 1.35, 0.1] },
        closeup: { pos: [-0.42, 1.70, 0.86], look: [-0.90, 1.60, 0.28] },
        doorClose: { pos: [-2.45, 1.45, 2.35], look: [-3.95, 1.10, 1.65] }
      },
      variants: [
        { id: "success", label: "M17 正常解除（閉扉＋白鍵）" },
        { id: "noKey", label: "白鍵なし（試すのみ）" },
        { id: "doorOpen", label: "扉開状態（解除不可）" },
        { id: "listenE274", label: "E274 解除後・扉に耳を寄せる" }
      ]
    },

    Q02: {
      missionId: "M18",
      title: "Q02 白礼拝廊／M18「空番に白百合の縁を渡る」",
      roomSize: { w: 7.4, d: 17.0, h: 6.8 },
      centerWhiteRange: { minX: -2.1, maxX: 2.1, minZ: -7.5, maxZ: 7.5 },
      darkStrip: { centerX: -2.65, width: 1.5, lilyStartZ: 6.6, lilyEndZ: -6.6, lilyStep: 1.1 },
      railingKnotPos: [-3.38, 0.68, 7.15],
      heroPath: {
        enter: [0.0, 7.9],
        waitSafe: [-2.65, 7.7],
        crossEnd: [-2.65, -7.7],
        exitTurn: [0.0, -8.1],
        caughtCenter: [0.0, 1.6]
      },
      guard: {
        watchPos: [1.45, -2.7],
        alcovePos: [2.55, -3.7],
        pillarPos: [2.25, -2.25]
      },
      cameras: {
        wide: { pos: [-0.4, 5.4, 10.6], look: [-0.6, 1.1, -1.5] },
        closeup: { pos: [-1.15, 1.55, 9.05], look: [-2.85, 0.55, 6.95] }
      },
      variants: [
        { id: "emptyShift", label: "M18 空番・白百合の縁を通過＆西番往復" },
        { id: "guardPresent", label: "西番在室（入口西側で待機）" },
        { id: "cloakCaughtE278", label: "E278 マント透明＋影輪郭で発見" },
        { id: "plainCaughtE280", label: "E280 マントなし中央進入で発見" }
      ]
    },

    Q03: {
      missionId: "M19",
      title: "Q03 旧礼拝堂／M19「冠なき像から地下階段を開く」",
      roomSize: { w: 13.0, d: 13.0, h: 8.2 },
      statues: [
        { x: -3.3, z: -3.2, crowned: true },
        { x: -1.1, z: -3.2, crowned: true },
        { x: 1.1, z: -3.2, crowned: false },
        { x: 3.3, z: -3.2, crowned: true }
      ],
      socketPos: [1.1, 1.30, -3.50],
      socketWidth: 0.26,
      weightWidth: 0.23,
      heroPath: {
        enter: [0.0, 5.7],
        eastFlank: [4.7, -2.1],
        behindRow: [4.7, -4.45],
        insertPos: [1.22, -4.08],
        wrongStatuePos: [-1.1, -4.28],
        stairEdge: [1.05, -4.95],
        stairBottom: [-0.75, -4.95],
        q04PortalExit: [-0.30, -7.15]
      },
      opening: {
        centerX: 0.0,
        centerZ: -4.95,
        widthX: 1.8,
        lengthZ: 2.2,
        stepCount: 6,
        stepHeight: 0.28
      },
      q04Handoff: {
        q03ExitPos: [-0.30, -1.68, -7.15],
        q03ExitYaw: Math.PI,
        q04ReceivePos: [0.0, 0.0, 7.7],
        q04ReceiveYaw: Math.PI
      },
      timings: {
        approach: 2.4,
        insertWeight: 0.55,
        shadowShift: 0.25,
        openFloor: 1.05,
        descend: 2.0
      },
      cameras: {
        wide: { pos: [3.6, 7.2, 3.8], look: [0.3, 0.6, -4.2] },
        closeup: { pos: [1.95, 1.52, -4.95], look: [1.12, 1.30, -3.52] }
      },
      variants: [
        { id: "success", label: "M19 冠なき像→地下階段＆北Q04接続" },
        { id: "wrongStatue", label: "別の像（冠あり）を調べる（床閉）" },
        { id: "noWeight", label: "錘なしで空受け口を調べる（床閉）" }
      ]
    }
  };

  // =========================================================================
  // 共通数学・2ボーンIK・単一階段高さ計算
  // =========================================================================
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smoothstep(v) { const t = clamp01(v); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  // 単一定義から階段の実際の上面Yを計算（X > maxX なら 0、各段の上面、X <= minX なら最下段踊り場）
  function getQ03StairSurfaceY(x, z) {
    const op = STAGE1_CONFIG.Q03.opening;
    const maxX = op.centerX + op.widthX / 2; // +0.90
    const minX = op.centerX - op.widthX / 2; // -0.90
    const minZ = op.centerZ - op.lengthZ / 2; // -6.05
    const maxZ = op.centerZ + op.lengthZ / 2; // -3.85
    const landingY = -op.stepCount * op.stepHeight; // -1.68
    const inPitX = (x >= minX - 0.05 && x <= maxX + 0.05);
    // 通常床（階段ピット・北側地下踊り場の範囲外）は常に Y = 0 を返す
    if (!inPitX) return 0;
    if (z !== undefined) {
      if (z > maxZ) return 0;                // 南玄関・通常床
      if (z <= minZ && z >= -8.6) return landingY; // 北側地下踊り場・Q04開口
      if (z < -8.6) return 0;
    }
    if (x >= maxX) return 0;
    if (x <= minX) return landingY;
    const idx = Math.min(op.stepCount - 1, Math.max(0, Math.floor(((maxX - x) / op.widthX) * op.stepCount)));
    return -(idx + 1) * op.stepHeight;
  }

  // 解析的2ボーン腕IK（arm.socket のワールド位置を targetWorld に厳密一致させる）
  const _ikShW = new THREE.Vector3();
  const _ikParentInv = new THREE.Matrix4();
  const _ikTargetLocal = new THREE.Vector3();
  const _ikPoleLocal = new THREE.Vector3();
  const _ikDir = new THREE.Vector3();
  const _ikSide = new THREE.Vector3();
  const _ikBend = new THREE.Vector3();
  const _ikUpperDir = new THREE.Vector3();
  const _ikForeDir = new THREE.Vector3();
  const _ikQ1 = new THREE.Quaternion();
  const _ikQ2 = new THREE.Quaternion();
  const _ikDown = new THREE.Vector3(0, -1, 0);

  function solveArmIK(arm, targetWorld, poleOffsetLocal) {
    const sh = arm.shoulder;
    const el = arm.elbow;
    if (!sh || !sh.parent) return;
    sh.parent.updateWorldMatrix(true, false);
    sh.getWorldPosition(_ikShW);

    // ターゲットを upperBody（shoulder.parent）ローカル空間へ変換
    _ikParentInv.copy(sh.parent.matrixWorld).invert();
    _ikTargetLocal.copy(targetWorld).applyMatrix4(_ikParentInv).sub(sh.position);

    const L1 = Math.abs(el.position.y) || 0.26;
    const L2 = arm.socket ? arm.socket.position.length() : 0.265;
    const rawDist = _ikTargetLocal.length();
    const minD = Math.abs(L1 - L2) + 0.015;
    const maxD = L1 + L2 - 0.002;
    const d = Math.max(minD, Math.min(maxD, rawDist));

    _ikDir.copy(_ikTargetLocal).normalize();
    // 肘が向くべきポール方向（自然な外側・下方）
    _ikPoleLocal.copy(poleOffsetLocal);
    _ikSide.crossVectors(_ikDir, _ikPoleLocal);
    if (_ikSide.lengthSq() < 1e-6) _ikSide.set(1, 0, 0);
    _ikSide.normalize();
    _ikBend.crossVectors(_ikSide, _ikDir).normalize();

    const cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    _ikUpperDir.copy(_ikDir).multiplyScalar(cosA).addScaledVector(_ikBend, sinA).normalize();

    // shoulder 回転（ローカル -Y を _ikUpperDir へ）
    _ikQ1.setFromUnitVectors(_ikDown, _ikUpperDir);
    sh.quaternion.copy(_ikQ1);

    // elbow ローカルでの前腕方向を計算し回転
    _ikForeDir.copy(_ikTargetLocal).addScaledVector(_ikUpperDir, -L1);
    if (_ikForeDir.lengthSq() < 1e-8) _ikForeDir.copy(_ikUpperDir);
    _ikForeDir.normalize();
    _ikForeDir.applyQuaternion(_ikQ1.clone().invert()).normalize();
    _ikQ2.setFromUnitVectors(_ikDown, _ikForeDir);
    el.quaternion.copy(_ikQ2);
    sh.updateWorldMatrix(true, true);
  }

  // 分割首輪ビルダー（既存P00首輪の色・発光を引き継ぎ、5部品：左右半環・後蝶番・前留め金・鍵穴）
  function buildSplitCollar(envMap) {
    const root = new THREE.Group();
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x3b4454,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.85,
      envMap: envMap || null
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd9b24c,
      roughness: 0.28,
      metalness: 0.88,
      envMap: envMap || null
    });
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x090b10 });

    const R = 0.078;
    const tube = 0.0155;

    // 後ろ蝶番（Z = -R）
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.042, 10), brassMat);
    hinge.position.set(0, 0, -R);
    root.add(hinge);

    // 左半環
    const leftPivot = new THREE.Group();
    leftPivot.position.set(0, 0, -R);
    const leftArc = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 18, Math.PI), cMat);
    leftArc.rotation.x = Math.PI / 2;
    leftArc.rotation.z = Math.PI / 2;
    leftArc.position.set(0, 0, R);
    leftPivot.add(leftArc);
    root.add(leftPivot);

    // 右半環＋正面留め金＆鍵穴
    const rightPivot = new THREE.Group();
    rightPivot.position.set(0, 0, -R);
    const rightArc = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 18, Math.PI), cMat);
    rightArc.rotation.x = Math.PI / 2;
    rightArc.rotation.z = -Math.PI / 2;
    rightArc.position.set(0, 0, R);
    rightPivot.add(rightArc);

    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.022), brassMat);
    clasp.position.set(0, 0, R * 2 + 0.004);
    rightPivot.add(clasp);

    // 鍵穴アンカー（ワールド座標照合用）
    const keyholeAnchor = new THREE.Group();
    keyholeAnchor.position.set(0, 0, R * 2 + 0.016);
    rightPivot.add(keyholeAnchor);

    const keySlotTop = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 10), holeMat);
    keySlotTop.position.set(0, 0.004, 0.001);
    keyholeAnchor.add(keySlotTop);
    const keySlotBot = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 0.014), holeMat);
    keySlotBot.position.set(0, -0.004, 0.001);
    keyholeAnchor.add(keySlotBot);

    // 左手支え点アンカー（留め金脇）
    const leftGripAnchor = new THREE.Group();
    leftGripAnchor.position.set(0.055, 0, R * 1.9);
    leftPivot.add(leftGripAnchor);

    root.add(rightPivot);

    return {
      group: root,
      leftPivot: leftPivot,
      rightPivot: rightPivot,
      keyholeAnchor: keyholeAnchor,
      leftGripAnchor: leftGripAnchor,
      material: cMat,
      setOpenAngleDeg: function (deg) {
        const rad = (deg * Math.PI) / 180;
        leftPivot.rotation.y = -rad * 0.5;
        rightPivot.rotation.y = rad * 0.5;
      },
      setGlow: function (intensity) {
        cMat.emissiveIntensity = intensity;
      }
    };
  }

  function createDebugLayer() {
    const g = new THREE.Group();
    g.visible = false;
    function addPoint(x, y, z, colorHex, radius) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(radius || 0.10, 10, 8),
        new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false, transparent: true, opacity: 0.9 })
      );
      m.position.set(x, y, z);
      m.renderOrder = 999;
      g.add(m);
      return m;
    }
    function addPath(pointsXZ, colorHex, y) {
      const pts = pointsXZ.map(function (p) { return new THREE.Vector3(p[0], y || 0.08, p[1]); });
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex }));
      g.add(line);
      pointsXZ.forEach(function (p) { addPoint(p[0], (y || 0.08) + 0.02, p[1], colorHex, 0.085); });
    }
    return { group: g, addPoint: addPoint, addPath: addPath };
  }

  function createActorRig(charId, options) {
    const charObj = getCharApi().createCharacter(charId, options || {});
    const rig = new THREE.Group();
    rig.add(charObj.group);
    return { rig: rig, charObj: charObj };
  }

  // =========================================================================
  // 場面1: Q01 無音祈祷室／M17「首輪を外す」＆ E274
  // =========================================================================
  function buildQ01Controller(opts) {
    const cfg = STAGE1_CONFIG.Q01;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("Q01", { envMap: opts.envMap });
    root.add(env.group);

    function resolvePortal(targetId, fb) {
      const p = env.corridorPortals.find(function (x) { return x.targetId === targetId; });
      if (p) return { x: p.entryX, z: p.entryZ, dirX: p.dirX, dirZ: p.dirZ, matched: true };
      return { x: fb.fallbackX, z: fb.fallbackZ, dirX: -1, dirZ: 0, matched: false };
    }
    const pW04 = resolvePortal("W04", cfg.doors.W04);
    const pQ02 = resolvePortal("Q02", cfg.doors.Q02);

    // W04側・Q02側 独立開閉扉（取っ手ワールド位置を常時参照可能）
    const doorWood = new THREE.MeshStandardMaterial({ color: 0x4d311e, roughness: 0.78 });
    const doorBrass = new THREE.MeshStandardMaterial({ color: 0xd9b24c, roughness: 0.3, metalness: 0.85 });
    function makeSwingDoor(portal) {
      const pivot = new THREE.Group();
      pivot.position.set(portal.x + 0.24, 0, portal.z - 1.12);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.11, 3.2, 2.24), doorWood);
      leaf.position.set(0, 1.6, 1.12);
      pivot.add(leaf);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 8), doorBrass);
      handle.position.set(0.11, 1.08, 1.95);
      pivot.add(handle);
      root.add(pivot);
      return { pivot: pivot, handle: handle };
    }
    const doorW04 = makeSwingDoor(pW04);
    const doorQ02 = makeSwingDoor(pQ02);

    // 主人公 P00（既存単環首輪を完全非表示）
    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = false;
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    // 首元アンカー（装着時の基準点）
    const neckAnchor = new THREE.Group();
    neckAnchor.position.set(0, 0.675, 0);
    hero.charObj.upperBody.add(neckAnchor);

    // 単一の分割首輪（root直下で管理し、装着→抜去→手持ちを飛び0で連続表示）
    const collar = buildSplitCollar(opts.envMap);
    root.add(collar.group);

    // 白鍵 I06（単一オブジェクト・長さ0.12m・鍵先アンカー付き）
    const keyObj = global.CastleEscapeItems.createItemOrProp("I06", { envMap: opts.envMap });
    const keyHolder = new THREE.Group();
    // I06実モデル: 先端 tip がローカル y=-0.68、持ち手 bow がローカル y=+0.42 (全長約1.30m → scale 0.092 で約0.12m)
    // X軸に +Math.PI/2 回転すると、ローカル(0, y, 0) -> (0, 0, y) となり先端(y=-0.68)が -Z(鍵穴方向) を向く！
    keyObj.group.scale.setScalar(0.092);
    keyObj.group.rotation.set(Math.PI / 2, 0, 0);
    keyHolder.add(keyObj.group);
    // 実モデルの先端・持ち手座標から直接アンカーを配置（keyObj.groupローカルに配置して回転とも完全一致）
    const keyTipAnchor = new THREE.Group();
    keyTipAnchor.position.set(0, -0.68, 0);
    keyObj.group.add(keyTipAnchor);
    const keyGripAnchor = new THREE.Group();
    keyGripAnchor.position.set(0, 0.42, 0);
    keyObj.group.add(keyGripAnchor);
    keyHolder.visible = false;
    root.add(keyHolder);

    const dbg = createDebugLayer();
    dbg.addPath([cfg.heroPath.enter, cfg.heroPath.doorHandle, cfg.heroPath.unlock, cfg.heroPath.toQ02], 0x38bdf8, 0.06);
    dbg.addPoint(pW04.x, 1.5, pW04.z, 0xf59e0b, 0.13);
    dbg.addPoint(pQ02.x, 1.5, pQ02.z, 0x22c55e, 0.13);
    dbg.addPoint(cfg.heroPath.unlock[0], cfg.collarWorldY, cfg.heroPath.unlock[1], 0xec4899, 0.07);
    root.add(dbg.group);

    const state = {
      variant: "success",
      playing: false,
      time: 0,
      statusText: "初期状態：W04から入室",
      customGameState: null,
      holdingSnapshot: false,
      collarState: "worn" // "worn" | "held" | "stowed"
    };

    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();
    const _vD = new THREE.Vector3();
    const _qA = new THREE.Quaternion();

    function syncCollarToNeck() {
      hero.rig.updateWorldMatrix(true, true);
      neckAnchor.getWorldPosition(_vA);
      neckAnchor.getWorldQuaternion(_qA);
      collar.group.position.copy(_vA);
      collar.group.quaternion.copy(_qA);
      collar.group.updateWorldMatrix(true, true);
    }

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      const hp = gs.heroPos || cfg.heroPath.unlock;
      hero.rig.position.set(hp[0], 0, hp[1]);
      hero.rig.rotation.y = (gs.heroYaw !== undefined) ? gs.heroYaw : 0;
      doorW04.pivot.rotation.y = (gs.doors && gs.doors.W04Open) ? -Math.PI * 0.34 : 0;
      doorQ02.pivot.rotation.y = (gs.doors && gs.doors.Q02Open) ? -Math.PI * 0.34 : 0;

      if (gs.collarRemoved) {
        collar.group.visible = false;
        collar.setGlow(0);
        state.collarState = "stowed";
      } else {
        collar.group.visible = true;
        collar.setOpenAngleDeg(0);
        collar.setGlow(0.9);
        syncCollarToNeck();
        state.collarState = "worn";
      }
      keyHolder.visible = false;
      state.statusText = "保存状態復元：首輪" + (gs.collarRemoved ? "解除済" : "装着中")
        + "／W04扉" + ((gs.doors && gs.doors.W04Open) ? "開" : "閉")
        + "／白鍵" + (gs.hasKey ? "あり" : "なし");
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) {
        applyGameStateSnapshot(state.customGameState);
        return;
      }
      const T = cfg.timings;
      const v = state.variant;
      const openAngle = -Math.PI * 0.34; // 扉が室内側へ開く角度（取っ手が主人公の腕届く範囲）

      charApi.applyPose(hero.charObj, "stand", sec);
      doorQ02.pivot.rotation.y = 0;
      keyHolder.visible = false;

      // E274: M17の後 → 開始時から首輪なし・発光なし
      if (v === "listenE274") {
        doorW04.pivot.rotation.y = 0;
        collar.group.visible = false;
        collar.setGlow(0);
        state.collarState = "stowed";

        if (sec < 0.7) {
          const p = smoothstep(sec / 0.7);
          hero.rig.position.set(lerp(cfg.heroPath.enter[0], -3.72, p), 0, lerp(cfg.heroPath.enter[1], pW04.z + 0.1, p));
          hero.rig.rotation.y = lerpAngle(Math.PI / 2, 0.08, p);
          charApi.applyPose(hero.charObj, "walk", sec * 2.4);
          state.statusText = "E274（解除後・首輪なし）：閉じたW04扉へ近づく";
        } else if (sec < 2.2) {
          hero.rig.position.set(-3.72, 0, pW04.z + 0.1);
          hero.rig.rotation.y = 0.08;
          hero.charObj.headPivot.rotation.set(0.08, 0.32, 0.26);
          hero.charObj.upperBody.rotation.z = 0.12;
          state.statusText = "E274（首輪なし・無発光）：閉扉に横顔を寄せて耳を傾ける";
        } else {
          const p = smoothstep((sec - 2.2) / 0.9);
          hero.rig.position.set(lerp(-3.72, cfg.heroPath.toQ02[0], p), 0, lerp(pW04.z + 0.1, cfg.heroPath.toQ02[1], p));
          hero.rig.rotation.y = lerpAngle(0.08, -Math.PI / 2, p);
          if (p < 0.98) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
          state.statusText = "E274：一歩離れてQ02側の戸へ向く";
        }
        return;
      }

      // 初期状態は首輪装着・発光
      collar.group.visible = true;
      collar.setOpenAngleDeg(0);
      collar.setGlow(0.9);
      state.collarState = "worn";

      let t = sec;
      // 1) W04側から入室 → 扉取っ手そばへ移動
      if (t < T.walkToDoor) {
        const p = smoothstep(t / T.walkToDoor);
        doorW04.pivot.rotation.y = openAngle;
        doorW04.pivot.updateWorldMatrix(true, true);
        doorW04.handle.getWorldPosition(_vA);
        // 扉が開いた状態の取っ手の東側 0.36m に立つ
        const standX = _vA.x + 0.34;
        const standZ = _vA.z + 0.18;
        hero.rig.position.set(lerp(cfg.heroPath.enter[0], standX, p), 0, lerp(cfg.heroPath.enter[1], standZ, p));
        hero.rig.rotation.y = lerpAngle(-Math.PI * 0.5, -Math.PI * 0.5, p);
        charApi.applyPose(hero.charObj, "walk", sec * 2.6);
        syncCollarToNeck();
        state.statusText = "W04側から入室・扉の取っ手へ近づく";
        return;
      }
      t -= T.walkToDoor;

      // 2) 右手を伸ばして取っ手を握る (0.25s) — doorOpen時は握らず通過
      if (t < T.reachHandle) {
        const p = smoothstep(t / T.reachHandle);
        doorW04.pivot.rotation.y = openAngle;
        doorW04.pivot.updateWorldMatrix(true, true);
        doorW04.handle.getWorldPosition(_vA);
        hero.rig.position.set(_vA.x + 0.34, 0, _vA.z + 0.18);
        hero.rig.rotation.y = -Math.PI * 0.5;
        hero.rig.updateWorldMatrix(true, true);
        if (v !== "doorOpen") {
          hero.charObj.rightArm.socket.getWorldPosition(_vB);
          _vC.lerpVectors(_vB, _vA, p);
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.3, -0.4, -0.2));
        }
        syncCollarToNeck();
        state.statusText = (v === "doorOpen") ? "扉開状態（閉めずに解除位置へ）" : "右手でW04扉の取っ手を握る";
        return;
      }
      t -= T.reachHandle;

      // 3) 取っ手を握ったまま扉を閉める (0.70s) — 毎フレーム取っ手の実座標へ右手IK追従！
      if (t < T.closeDoor) {
        const p = smoothstep(t / T.closeDoor);
        doorW04.pivot.rotation.y = (v === "doorOpen") ? openAngle : lerp(openAngle, 0, p);
        doorW04.pivot.updateWorldMatrix(true, true);
        doorW04.handle.getWorldPosition(_vA);
        // 扉の円弧に合わせて主人公も半歩寄り添うことで腕が届き続け、取っ手との接触距離0.00mを維持
        hero.rig.position.set(_vA.x + 0.34, 0, _vA.z + 0.18);
        hero.rig.rotation.y = -Math.PI * 0.5;
        hero.rig.updateWorldMatrix(true, true);
        if (v !== "doorOpen") {
          solveArmIK(hero.charObj.rightArm, _vA, new THREE.Vector3(-0.3, -0.4, -0.2));
        }
        syncCollarToNeck();
        state.statusText = (v === "doorOpen") ? "扉開状態（開いたまま）" : "右手で取っ手を握ったままW04扉を閉める (0.70秒)";
        return;
      }
      t -= T.closeDoor;

      // 4) 扉が閉まった後に手を離す (0.20s)
      doorW04.pivot.rotation.y = (v === "doorOpen") ? openAngle : 0;
      doorW04.pivot.updateWorldMatrix(true, true);
      doorW04.handle.getWorldPosition(_vA);
      if (t < T.releaseHandle) {
        const p = smoothstep(t / T.releaseHandle);
        hero.rig.position.set(_vA.x + 0.34, 0, _vA.z + 0.18);
        hero.rig.rotation.y = -Math.PI * 0.5;
        hero.rig.updateWorldMatrix(true, true);
        if (v !== "doorOpen") {
          _vC.copy(_vA).add(new THREE.Vector3(0.18 * p, -0.18 * p, 0));
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.3, -0.4, -0.2));
        }
        syncCollarToNeck();
        state.statusText = "閉扉完了・取っ手から右手を離す";
        return;
      }
      t -= T.releaseHandle;

      // 5) 解除位置 (-0.9, +0.2) へ移動して +Z へ向き直る
      const startWalkX = _vA.x + 0.34, startWalkZ = _vA.z + 0.18;
      if (t < T.walkToUnlock) {
        const p = smoothstep(t / T.walkToUnlock);
        hero.rig.position.set(lerp(startWalkX, cfg.heroPath.unlock[0], p), 0, lerp(startWalkZ, cfg.heroPath.unlock[1], p));
        hero.rig.rotation.y = lerpAngle(-Math.PI * 0.5, 0, p);
        charApi.applyPose(hero.charObj, "walk", sec * 2.6);
        syncCollarToNeck();
        state.statusText = "解除位置 (-0.9, +0.2) へ移動・正面(+Z)を向く";
        return;
      }
      t -= T.walkToUnlock;

      // 解除位置固定
      hero.rig.position.set(cfg.heroPath.unlock[0], 0, cfg.heroPath.unlock[1]);
      hero.rig.rotation.y = 0;
      syncCollarToNeck();

      // 鍵穴ワールド位置＆左手支え位置を取得
      collar.keyholeAnchor.getWorldPosition(_vA); // 鍵穴
      collar.leftGripAnchor.getWorldPosition(_vB); // 左手支え点

      const hasKey = (v !== "noKey");
      const canUnlock = (v === "success");

      // 6) 左手で留め金脇を支え、右手で白鍵I06を構え→軸合わせ→鍵穴まで差し込む (0.60s)
      if (t < T.insertKey) {
        const p = smoothstep(t / T.insertKey);
        // 左手は留め金脇へIK
        solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));
        if (hasKey) {
          keyHolder.visible = true;
          // 前半: 鍵穴の手前(+Z +0.11m)へ構えて軸合わせ、後半: 鍵先を鍵穴(Z+0.00m)まで差し込む
          const tipZ = (p < 0.5) ? lerp(0.16, 0.08, p * 2) : lerp(0.08, 0.0, (p - 0.5) * 2);
          const tipY = (p < 0.5) ? lerp(-0.08, 0.0, p * 2) : 0.0;
          keyHolder.position.set(_vA.x, _vA.y + tipY, _vA.z + tipZ + 0.06256);
          keyHolder.rotation.set(0, 0, 0);
          keyHolder.updateWorldMatrix(true, true);
          keyGripAnchor.getWorldPosition(_vC);
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
          state.statusText = p < 0.5 ? "白鍵I06を鍵穴の手前で軸合わせ" : "鍵先を鍵穴へ差し込む (0.60秒)";
        } else {
          _vC.copy(_vA).add(new THREE.Vector3(-0.04, 0, 0.02));
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
          state.statusText = "白鍵なし：留め金を手で探る（解除不可）";
        }
        return;
      }

      if (!canUnlock) {
        // 白鍵なし・扉開はここで停止（留め金は外れない）
        solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));
        if (hasKey) {
          keyHolder.visible = true;
          keyHolder.position.set(_vA.x, _vA.y, _vA.z + 0.06256);
          keyHolder.rotation.set(0, 0, 0);
          keyHolder.updateWorldMatrix(true, true);
          keyGripAnchor.getWorldPosition(_vC);
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        } else {
          _vC.copy(_vA).add(new THREE.Vector3(-0.04, 0, 0.02));
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        }
        hero.charObj.headPivot.rotation.y = Math.sin(t * 4) * 0.1;
        state.statusText = (v === "noKey") ? "白鍵なし：留め金は外れず停止" : "扉開状態：無音未達のため留め金は外れず停止";
        return;
      }
      t -= T.insertKey;

      // 7) 鍵軸を中心に正面から見て時計回り60°（-π/3）ひねる (0.35s)
      if (t < T.turnKey) {
        const p = smoothstep(t / T.turnKey);
        solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));
        keyHolder.visible = true;
        keyHolder.position.set(_vA.x, _vA.y, _vA.z + 0.06256);
        keyHolder.rotation.set(0, 0, -p * (Math.PI / 3));
        keyHolder.updateWorldMatrix(true, true);
        keyGripAnchor.getWorldPosition(_vC);
        solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        state.statusText = "白鍵を正面から見て時計回りに60度ひねる (0.35秒・装着維持)";
        return;
      }
      t -= T.turnKey;

      // 8) 留め金が外れ、後ろ蝶番を中心に約40°開く (0.45s)
      if (t < T.openCollar) {
        const p = smoothstep(t / T.openCollar);
        collar.setOpenAngleDeg(p * 40);
        collar.setGlow(lerp(0.9, 0.35, p));
        collar.group.updateWorldMatrix(true, true);
        collar.leftGripAnchor.getWorldPosition(_vB);
        collar.keyholeAnchor.getWorldPosition(_vA);
        solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));
        keyHolder.visible = true;
        keyHolder.position.set(_vA.x, _vA.y, _vA.z + 0.06256 + p * 0.04);
        keyHolder.rotation.set(0, 0, -(Math.PI / 3));
        keyHolder.updateWorldMatrix(true, true);
        keyGripAnchor.getWorldPosition(_vC);
        solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        state.statusText = "留め金が外れ、後蝶番中心に40度開く (0.45秒)";
        return;
      }
      t -= T.openCollar;

      // 9) 首輪を前へ抜いて胸の高さへ下ろす (0.50s) — 単一首輪を連続補間し、左手IKがそのまま保持 → 飛び0.00m！
      if (t < T.removeCollar) {
        const p = smoothstep(t / T.removeCollar);
        collar.setOpenAngleDeg(40);
        collar.setGlow(0.0); // 手に取った時点で発光停止
        state.collarState = "held";
        neckAnchor.getWorldPosition(_vD);
        // 首元から前(+Z +0.20m)・胸の高さ(Y -0.26m)へ滑らかに連続移動
        collar.group.position.set(_vD.x + 0.04 * p, _vD.y - 0.26 * p, _vD.z + 0.22 * p);
        collar.group.rotation.set(0.28 * p, 0, 0);
        collar.group.updateWorldMatrix(true, true);
        collar.leftGripAnchor.getWorldPosition(_vB);
        solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));

        keyHolder.visible = true;
        keyHolder.position.set(_vD.x - 0.14, _vD.y - 0.24 * p, _vD.z + 0.22);
        keyHolder.rotation.set(0.2 * p, 0, -(Math.PI / 3));
        keyHolder.updateWorldMatrix(true, true);
        keyGripAnchor.getWorldPosition(_vC);
        solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        state.statusText = "首輪を前へ抜いて胸の高さへ（連続受渡・発光停止 0.50秒）";
        return;
      }
      t -= T.removeCollar;

      // 10) 鍵と首輪を手元からしまう (0.60s)
      if (t < T.stow) {
        const p = smoothstep(t / T.stow);
        neckAnchor.getWorldPosition(_vD);
        const showHeld = p < 0.72;
        collar.group.visible = showHeld;
        collar.setOpenAngleDeg(40);
        collar.setGlow(0.0);
        state.collarState = showHeld ? "held" : "stowed";
        if (showHeld) {
          collar.group.position.set(lerp(_vD.x + 0.04, _vD.x + 0.16, p), lerp(_vD.y - 0.26, _vD.y - 0.52, p), lerp(_vD.z + 0.22, _vD.z + 0.08, p));
          collar.group.rotation.set(0.28, 0, 0);
          collar.group.updateWorldMatrix(true, true);
          collar.leftGripAnchor.getWorldPosition(_vB);
          solveArmIK(hero.charObj.leftArm, _vB, new THREE.Vector3(0.45, -0.35, 0.2));
        }
        keyHolder.visible = showHeld;
        if (showHeld) {
          keyHolder.position.set(lerp(_vD.x - 0.14, _vD.x - 0.18, p), lerp(_vD.y - 0.24, _vD.y - 0.52, p), lerp(_vD.z + 0.22, _vD.z + 0.06, p));
          keyHolder.updateWorldMatrix(true, true);
          keyGripAnchor.getWorldPosition(_vC);
          solveArmIK(hero.charObj.rightArm, _vC, new THREE.Vector3(-0.45, -0.35, 0.2));
        }
        state.statusText = "外した首輪と白鍵をしまう (0.60秒)";
        return;
      }
      t -= T.stow;

      // 11) Q02側出入口手前 (-3.2, -1.65) へ移動
      collar.group.visible = false;
      keyHolder.visible = false;
      state.collarState = "stowed";
      const p = smoothstep(t / T.walkToQ02);
      hero.rig.position.set(lerp(cfg.heroPath.unlock[0], cfg.heroPath.toQ02[0], p), 0, lerp(cfg.heroPath.unlock[1], cfg.heroPath.toQ02[1], p));
      hero.rig.rotation.y = lerpAngle(0, -Math.PI * 0.5, p);
      if (p < 0.98) charApi.applyPose(hero.charObj, "walk", sec * 2.6);
      state.statusText = p >= 0.98 ? "完了：首輪解除済・収納済・Q02扉手前 (-3.2, -1.65)" : "Q02側出入口手前へ移動";
    }

    const totalDuration = cfg.timings.walkToDoor + cfg.timings.reachHandle + cfg.timings.closeDoor + cfg.timings.releaseHandle
      + cfg.timings.walkToUnlock + cfg.timings.insertKey + cfg.timings.turnKey + cfg.timings.openCollar
      + cfg.timings.removeCollar + cfg.timings.stow + cfg.timings.walkToQ02;

    return {
      id: "Q01",
      config: cfg,
      env: env,
      root: root,
      resolvedPortals: { W04: pW04, Q02: pQ02 },
      // 検証用ジオメトリ参照（実測スクリプトから接触距離を確認可能）
      _inspect: {
        hero: hero, doorW04: doorW04, doorQ02: doorQ02,
        collar: collar, keyHolder: keyHolder, keyTipAnchor: keyTipAnchor, keyGripAnchor: keyGripAnchor
      },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) {
        state.customGameState = null; state.holdingSnapshot = false;
        state.playing = false;
        if (ph === "initial") state.time = 0;
        else if (ph === "mid") state.time = state.variant === "listenE274" ? 1.4 : (cfg.timings.walkToDoor + cfg.timings.reachHandle + cfg.timings.closeDoor + cfg.timings.releaseHandle + cfg.timings.walkToUnlock + cfg.timings.insertKey);
        else state.time = state.variant === "listenE274" ? 3.2 : totalDuration;
        applyTimeline(state.time);
      },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) {
        if (name === "doorClose") {
          doorW04.pivot.updateWorldMatrix(true, true);
          const hp = new THREE.Vector3();
          doorW04.handle.getWorldPosition(hp);
          return { pos: [hp.x + 1.55, hp.y + 0.48, hp.z + 1.15], look: [hp.x + 0.12, hp.y + 0.06, hp.z - 0.05] };
        }
        return cfg.cameras[name] || cfg.cameras.wide;
      },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return state.variant === "listenE274" ? 3.2 : totalDuration; },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) {
          state.time += dt;
          const cap = state.variant === "listenE274" ? 3.2 : totalDuration;
          if (state.time >= cap) { state.time = cap; state.playing = false; }
        }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  // =========================================================================
  // 場面2: Q02 白礼拝廊／M18「空番に白百合の縁を渡る」＆ E278 / E279 / E280
  // =========================================================================
  function buildQ02Controller(opts) {
    const cfg = STAGE1_CONFIG.Q02;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("Q02", { envMap: opts.envMap });
    root.add(env.group);

    // 材質・模様による白床と暗い帯の分離
    const glossyWhiteMat = new THREE.MeshStandardMaterial({ color: 0xedeff5, roughness: 0.14, metalness: 0.15, envMap: opts.envMap || null });
    const matteDarkMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.95, metalness: 0.0 });
    const safeThreshMat = new THREE.MeshStandardMaterial({ color: 0x454959, roughness: 0.85 });

    [8.05, -8.05].forEach(function (tz) {
      const th = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.1), safeThreshMat);
      th.rotation.x = -Math.PI / 2; th.position.set(0, 0.032, tz); root.add(th);
    });
    const whiteZone = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 15.0), glossyWhiteMat);
    whiteZone.rotation.x = -Math.PI / 2; whiteZone.position.set(0, 0.028, 0); root.add(whiteZone);

    const darkStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 16.4), matteDarkMat);
    darkStrip.rotation.x = -Math.PI / 2; darkStrip.position.set(cfg.darkStrip.centerX, 0.035, 0); root.add(darkStrip);

    // 四枚花弁の白百合の低い浮き彫り（Z=+7.7, +6.6〜-6.6 1.1m間隔, -7.7）
    const lilyMatBright = new THREE.MeshStandardMaterial({ color: 0xf4f5fa, roughness: 0.45, emissive: 0x94a3b8, emissiveIntensity: 0.22 });
    const entryLilyMat = lilyMatBright.clone();
    const lastLilyMat = lilyMatBright.clone();
    const lilyZs = [7.7];
    for (let z = 6.6; z >= -6.61; z -= 1.1) lilyZs.push(Number(z.toFixed(2)));
    lilyZs.push(-7.7);

    lilyZs.forEach(function (lz, idx) {
      const lg = new THREE.Group();
      lg.position.set(cfg.darkStrip.centerX, 0.04, lz);
      const useMat = (idx === 0) ? entryLilyMat : ((idx === lilyZs.length - 1) ? lastLilyMat : lilyMatBright);
      for (let p = 0; p < 4; p++) {
        const a = (p * Math.PI) / 2 + Math.PI / 4;
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.09), useMat);
        petal.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
        petal.rotation.y = -a;
        lg.add(petal);
      }
      const centerDot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 10), new THREE.MeshStandardMaterial({ color: 0xe6c36e, roughness: 0.4 }));
      lg.add(centerDot);
      root.add(lg);
    });

    // 東壁沿いの柱と控えのくぼみ
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa5a9b5, roughness: 0.8 });
    const eastPillar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 6.4, 1.15), stoneMat);
    eastPillar.position.set(cfg.guard.pillarPos[0], 3.2, cfg.guard.pillarPos[1]);
    root.add(eastPillar);
    const alcoveWall = new THREE.Mesh(new THREE.BoxGeometry(0.95, 6.4, 0.6), stoneMat);
    alcoveWall.position.set(cfg.guard.pillarPos[0], 3.2, -4.8);
    root.add(alcoveWall);

    // 入口側の西壁沿い低い欄干＋結び目（E279）
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5c4636, roughness: 0.76 });
    const railPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 8), railMat);
    railPost.position.set(cfg.railingKnotPos[0], 0.36, cfg.railingKnotPos[2]);
    root.add(railPost);
    const railBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.5), railMat);
    railBar.position.set(cfg.railingKnotPos[0], 0.68, cfg.railingKnotPos[2]);
    root.add(railBar);
    const knotPivot = new THREE.Group();
    knotPivot.position.set(cfg.railingKnotPos[0] + 0.08, cfg.railingKnotPos[1], cfg.railingKnotPos[2]);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6), new THREE.MeshStandardMaterial({ color: 0xe8dcc2, roughness: 0.85 }));
    cord.position.y = -0.12; knotPivot.add(cord);
    const knotBead = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd9b24c, roughness: 0.45 }));
    knotBead.position.y = -0.25; knotPivot.add(knotBead);
    root.add(knotPivot);

    // 主人公 P00（首輪外し済み）
    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = false;
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    // E278 奉納灯が中央白床へ落とす「人の影の輪郭」（マントで姿が消えても影だけが残る）
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128; shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d");
    sctx.fillStyle = "rgba(12, 16, 28, 0.80)";
    sctx.beginPath(); sctx.ellipse(64, 72, 24, 42, 0, 0, Math.PI * 2); sctx.fill();
    sctx.beginPath(); sctx.arc(64, 26, 15, 0, Math.PI * 2); sctx.fill();
    const cloakShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.9),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, opacity: 0.9 })
    );
    cloakShadow.rotation.x = -Math.PI / 2;
    cloakShadow.position.set(0, 0.042, 0);
    cloakShadow.visible = false;
    root.add(cloakShadow);

    // 西番（近衛造形＋灰青の肩布）
    const westGuard = createActorRig("P16", { envMap: opts.envMap });
    const greyBlueMat = new THREE.MeshStandardMaterial({ color: 0x5c7a94, roughness: 0.78 });
    const shoulderCloth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.34, 16, 1, true), greyBlueMat);
    shoulderCloth.position.set(0, 0.48, 0);
    westGuard.charObj.upperBody.add(shoulderCloth);
    const drapeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.06), greyBlueMat);
    drapeL.position.set(-0.2, 0.25, 0.14);
    westGuard.charObj.upperBody.add(drapeL);
    root.add(westGuard.rig);

    const dbg = createDebugLayer();
    dbg.addPath([cfg.heroPath.enter, cfg.heroPath.waitSafe, cfg.heroPath.crossEnd, cfg.heroPath.exitTurn], 0x38bdf8, 0.08);
    dbg.addPath([cfg.guard.watchPos, cfg.guard.alcovePos], 0xf59e0b, 0.08);
    dbg.addPoint(cfg.railingKnotPos[0], cfg.railingKnotPos[1], cfg.railingKnotPos[2], 0xec4899, 0.1);
    root.add(dbg.group);

    const state = {
      variant: "emptyShift",
      playing: false,
      time: 0,
      statusText: "初期状態：南の入口 (0, +7.9)",
      customGameState: null
    };

    function setFlowerDim(dimmed) {
      const hex = dimmed ? 0x5c6375 : 0xf4f5fa;
      const em = dimmed ? 0.01 : 0.22;
      entryLilyMat.color.setHex(hex); entryLilyMat.emissiveIntensity = em;
      lastLilyMat.color.setHex(hex); lastLilyMat.emissiveIntensity = em;
    }

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      charApi.applyPose(westGuard.charObj, "stand", 0);
      const hp = gs.heroPos || cfg.heroPath.waitSafe;
      hero.rig.position.set(hp[0], 0, hp[1]);
      hero.rig.rotation.y = (gs.heroYaw !== undefined) ? gs.heroYaw : Math.PI;
      // マント着用時は主人公の姿を完全に隠し、中央白床なら影のみ表示
      const cloakActive = !!gs.wearingCloak;
      hero.charObj.group.visible = !cloakActive;
      cloakShadow.visible = cloakActive && Math.abs(hp[0]) < 2.1;
      cloakShadow.position.set(hp[0], 0.042, hp[1] - 0.12);

      const gPresent = (gs.guardPresent !== false);
      const gp = gPresent ? cfg.guard.watchPos : cfg.guard.alcovePos;
      westGuard.rig.position.set(gp[0], 0, gp[1]);
      westGuard.rig.rotation.y = gPresent ? -Math.PI / 2 : Math.PI * 0.72;
      setFlowerDim(!gPresent);
      knotPivot.rotation.z = 0;
      state.statusText = "保存状態復元：西番" + (gPresent ? "在室" : "空番")
        + "／マント" + (cloakActive ? "透明" : "通常") + (gs.detected ? "／発見" : "");
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) {
        applyGameStateSnapshot(state.customGameState);
        return;
      }
      const v = state.variant;
      charApi.applyPose(hero.charObj, "stand", sec);
      charApi.applyPose(westGuard.charObj, "stand", sec);
      hero.charObj.group.visible = true;
      cloakShadow.visible = false;
      setFlowerDim(false);

      // 1) 西番在室：南入口(0,+7.9)→西側待機(-2.65,+7.7)へ移動し待機を続ける
      if (v === "guardPresent") {
        westGuard.rig.position.set(cfg.guard.watchPos[0], 0, cfg.guard.watchPos[1]);
        westGuard.rig.rotation.y = -Math.PI / 2;
        knotPivot.rotation.z = Math.sin(sec * 3.8) * 0.18;
        if (sec < 1.1) {
          const p = smoothstep(sec / 1.1);
          hero.rig.position.set(lerp(cfg.heroPath.enter[0], cfg.heroPath.waitSafe[0], p), 0, lerp(cfg.heroPath.enter[1], cfg.heroPath.waitSafe[1], p));
          hero.rig.rotation.y = Math.atan2(cfg.heroPath.waitSafe[0] - cfg.heroPath.enter[0], cfg.heroPath.waitSafe[1] - cfg.heroPath.enter[1]);
          charApi.applyPose(hero.charObj, "walk", sec * 2.2);
          state.statusText = "西番在室：南入口から西側の安全待機位置へ寄る";
        } else {
          hero.rig.position.set(cfg.heroPath.waitSafe[0], 0, cfg.heroPath.waitSafe[1]);
          hero.rig.rotation.y = Math.PI;
          hero.charObj.group.position.y = -0.14;
          hero.charObj.leftLeg.hip.rotation.x = -0.34; hero.charObj.leftLeg.knee.rotation.x = 0.52;
          hero.charObj.rightLeg.hip.rotation.x = -0.34; hero.charObj.rightLeg.knee.rotation.x = 0.52;
          state.statusText = "西番在室：西側 (-2.65, +7.7) で腰を落として待機継続";
        }
        return;
      }

      // 2) E278（マント透明＋影輪郭のみ）＆ E280（マントなし通常姿で中央進入）
      if (v === "cloakCaughtE278" || v === "plainCaughtE280") {
        const isCloak = (v === "cloakCaughtE278");
        westGuard.rig.position.set(cfg.guard.watchPos[0], 0, cfg.guard.watchPos[1]);
        knotPivot.rotation.z = Math.sin(sec * 3.8) * 0.16;

        if (sec < 2.2) {
          const p = smoothstep(sec / 2.2);
          const hz = lerp(cfg.heroPath.enter[1], cfg.heroPath.caughtCenter[1], p);
          hero.rig.position.set(0, 0, hz);
          hero.rig.rotation.y = Math.PI;
          charApi.applyPose(hero.charObj, "walk", sec * 2.4);
          // E278: マントで主人公の姿が見えなくなり、中央白床に影の輪郭だけが残る！
          hero.charObj.group.visible = !isCloak;
          cloakShadow.visible = isCloak && hz < 7.5;
          cloakShadow.position.set(0, 0.042, hz - 0.12);
          westGuard.rig.rotation.y = -Math.PI / 2;
          state.statusText = isCloak
            ? "E278：マントで姿が消えているが、奉納灯の下の影輪郭だけが残る"
            : "E280：マントなしで中央白床へ進入（姿がそのまま露出）";
        } else {
          const p = smoothstep((sec - 2.2) / 0.8);
          hero.rig.position.set(0, 0, cfg.heroPath.caughtCenter[1]);
          hero.rig.rotation.y = Math.PI;
          hero.charObj.group.visible = !isCloak;
          cloakShadow.visible = isCloak;
          cloakShadow.position.set(0, 0.042, cfg.heroPath.caughtCenter[1] - 0.12);
          westGuard.rig.position.set(lerp(cfg.guard.watchPos[0], 0.95, p), 0, lerp(cfg.guard.watchPos[1], -2.05, p));
          westGuard.rig.rotation.y = lerpAngle(-Math.PI / 2, -0.32, p);
          westGuard.charObj.headPivot.rotation.y = -0.15;
          westGuard.charObj.rightArm.shoulder.rotation.set(-1.35 * p, 0, 0.1);
          westGuard.charObj.rightArm.elbow.rotation.x = -0.25;
          state.statusText = isCloak
            ? "E278 発見：影の輪郭に気づいた西番が顔を向け手で示して一歩前進"
            : "E280 発見：中央白床の主人公に西番が顔を向け手で示して一歩前進";
        }
        return;
      }

      // 3) M18 空番成功：南入口(0,+7.9)→西待機(-2.65,+7.7)→西番退避→白百合帯横断(-2.65,-7.7)→北敷居(0,-8.1)→西番復帰！
      // Phase A (0.0〜1.1s): 南の入口(0,+7.9)から西側待機(-2.65,+7.7)へ歩く
      if (sec < 1.1) {
        const p = smoothstep(sec / 1.1);
        const dirYaw = Math.atan2(cfg.heroPath.waitSafe[0] - cfg.heroPath.enter[0], cfg.heroPath.waitSafe[1] - cfg.heroPath.enter[1]);
        hero.rig.position.set(lerp(cfg.heroPath.enter[0], cfg.heroPath.waitSafe[0], p), 0, lerp(cfg.heroPath.enter[1], cfg.heroPath.waitSafe[1], p));
        hero.rig.rotation.y = dirYaw;
        charApi.applyPose(hero.charObj, "walk", sec * 2.3);
        westGuard.rig.position.set(cfg.guard.watchPos[0], 0, cfg.guard.watchPos[1]);
        westGuard.rig.rotation.y = -Math.PI / 2;
        knotPivot.rotation.z = Math.sin(sec * 3.8) * 0.18;
        state.statusText = "M18：南入口 (0, +7.9) から西側待機 (-2.65, +7.7) へ移動";
        return;
      }

      // Phase B (1.1〜2.7s): 主人公は西側で腰を落として待つ、西番は頭→肩→足で東柱裏へ退避、結び目静止＆花減光(E279)
      if (sec < 2.7) {
        const local = sec - 1.1;
        const p = smoothstep(local / 1.6);
        hero.rig.position.set(cfg.heroPath.waitSafe[0], 0, cfg.heroPath.waitSafe[1]);
        hero.rig.rotation.y = Math.PI;
        hero.charObj.group.position.y = -0.14;
        hero.charObj.leftLeg.hip.rotation.x = -0.32; hero.charObj.leftLeg.knee.rotation.x = 0.5;
        hero.charObj.rightLeg.hip.rotation.x = -0.32; hero.charObj.rightLeg.knee.rotation.x = 0.5;
        hero.charObj.headPivot.rotation.y = -0.25 * p;

        if (local < 0.45) {
          westGuard.rig.position.set(cfg.guard.watchPos[0], 0, cfg.guard.watchPos[1]);
          westGuard.rig.rotation.y = -Math.PI / 2;
          westGuard.charObj.headPivot.rotation.y = -lerp(0, 0.85, local / 0.45);
          westGuard.charObj.upperBody.rotation.y = -lerp(0, 0.45, Math.max(0, (local - 0.15) / 0.3));
        } else {
          const wp = smoothstep((local - 0.45) / 1.15);
          westGuard.rig.position.set(lerp(cfg.guard.watchPos[0], cfg.guard.alcovePos[0], wp), 0, lerp(cfg.guard.watchPos[1], cfg.guard.alcovePos[1], wp));
          westGuard.rig.rotation.y = lerpAngle(-Math.PI / 2, Math.PI * 0.72, Math.min(1, wp * 2.0));
          charApi.applyPose(westGuard.charObj, "walk", local * 2.4);
        }
        knotPivot.rotation.z = Math.sin(sec * 3.8) * 0.18 * (1 - p);
        setFlowerDim(p > 0.75);
        state.statusText = "E279/M18：西番が頭→肩→足で東柱裏へ退避・結び目静止＆花印減光";
        return;
      }

      // Phase C (2.7〜7.7s): 白百合帯(-2.65,+7.7 → -2.65,-7.7)を小歩幅＆接地一致で直進（速度 3.08m/s、歩調合わせ）
      if (sec < 7.7) {
        const local = sec - 2.7;
        const p = smoothstep(local / 5.0);
        westGuard.rig.position.set(cfg.guard.alcovePos[0], 0, cfg.guard.alcovePos[1]);
        westGuard.rig.rotation.y = Math.PI * 0.72;
        knotPivot.rotation.z = 0;
        setFlowerDim(true);

        hero.rig.position.set(cfg.darkStrip.centerX, 0, lerp(cfg.heroPath.waitSafe[1], cfg.heroPath.crossEnd[1], p));
        hero.rig.rotation.y = Math.PI;
        // 歩行速度に合わせた脚位相（横滑り防止）
        charApi.applyPose(hero.charObj, "walk", local * 3.0);
        hero.charObj.leftLeg.hip.rotation.x *= 0.62;
        hero.charObj.rightLeg.hip.rotation.x *= 0.62;
        state.statusText = "M18：空番中に西側の暗い白百合の縁を小歩幅で北へ横断中";
        return;
      }

      // Phase D (7.7〜8.7s): 北端 (-2.65,-7.7) から北のQ03側安全敷居 (0,-8.1) へ進行方向を向いて曲がり姿勢復帰
      if (sec < 8.7) {
        const local = sec - 7.7;
        const p = smoothstep(local / 1.0);
        westGuard.rig.position.set(cfg.guard.alcovePos[0], 0, cfg.guard.alcovePos[1]);
        westGuard.rig.rotation.y = Math.PI * 0.72;
        knotPivot.rotation.z = 0;
        setFlowerDim(true);

        const turnYaw = Math.atan2(cfg.heroPath.exitTurn[0] - cfg.heroPath.crossEnd[0], cfg.heroPath.exitTurn[1] - cfg.heroPath.crossEnd[1]);
        hero.rig.position.set(lerp(cfg.heroPath.crossEnd[0], cfg.heroPath.exitTurn[0], p), 0, lerp(cfg.heroPath.crossEnd[1], cfg.heroPath.exitTurn[1], p));
        hero.rig.rotation.y = p < 0.85 ? turnYaw : lerpAngle(turnYaw, Math.PI, (p - 0.85) / 0.15);
        if (p < 0.96) charApi.applyPose(hero.charObj, "walk", local * 2.4);
        state.statusText = "M18：北のQ03側安全敷居 (0, -8.1) へ向きを変えて到達・姿勢復帰";
        return;
      }

      // Phase E (8.7〜10.3s): 主人公が北敷居に到着した後、西番が逆経路で定位置 (+1.45, -2.7) へ戻る（往復完了）
      const local = sec - 8.7;
      const wp = smoothstep(local / 1.6);
      hero.rig.position.set(cfg.heroPath.exitTurn[0], 0, cfg.heroPath.exitTurn[1]);
      hero.rig.rotation.y = Math.PI;
      const returnYaw = Math.atan2(cfg.guard.watchPos[0] - cfg.guard.alcovePos[0], cfg.guard.watchPos[1] - cfg.guard.alcovePos[1]);
      westGuard.rig.position.set(lerp(cfg.guard.alcovePos[0], cfg.guard.watchPos[0], wp), 0, lerp(cfg.guard.alcovePos[1], cfg.guard.watchPos[1], wp));
      westGuard.rig.rotation.y = wp < 0.8 ? returnYaw : lerpAngle(returnYaw, -Math.PI / 2, (wp - 0.8) / 0.2);
      if (wp < 0.96) charApi.applyPose(westGuard.charObj, "walk", local * 2.4);
      knotPivot.rotation.z = Math.sin(sec * 3.8) * 0.16 * wp;
      setFlowerDim(wp < 0.5);
      state.statusText = wp >= 0.96 ? "完了：主人公Q03側到達後、西番が巡回位置へ復帰（往復完了）" : "西番が東柱裏から元の巡回位置 (+1.45, -2.7) へ戻る";
    }

    const totalDuration = 10.4;

    return {
      id: "Q02",
      config: cfg,
      env: env,
      root: root,
      _inspect: { hero: hero, westGuard: westGuard, cloakShadow: cloakShadow, knotPivot: knotPivot },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) {
        state.customGameState = null; state.holdingSnapshot = false;
        state.playing = false;
        if (ph === "initial") state.time = 0;
        else if (ph === "mid") state.time = (state.variant === "cloakCaughtE278" || state.variant === "plainCaughtE280") ? 2.1 : 5.2;
        else state.time = (state.variant === "cloakCaughtE278" || state.variant === "plainCaughtE280") ? 3.1 : (state.variant === "guardPresent" ? 1.5 : totalDuration);
        applyTimeline(state.time);
      },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) {
        if (name === "closeup" && (state.variant === "cloakCaughtE278" || state.variant === "plainCaughtE280")) {
          return { pos: [-2.4, 3.05, 4.15], look: [0.35, 0.85, -0.55] };
        }
        return cfg.cameras[name] || cfg.cameras.wide;
      },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return (state.variant === "cloakCaughtE278" || state.variant === "plainCaughtE280") ? 3.2 : (state.variant === "guardPresent" ? 2.0 : totalDuration); },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) {
          state.time += dt;
          const cap = this.getTotalDuration();
          if (state.time >= cap) { state.time = cap; state.playing = false; }
        }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  // =========================================================================
  // 場面3: Q03 旧礼拝堂／M19「冠なき像から地下階段を開く」＆ 北Q04接続
  // =========================================================================
  function buildQ03Controller(opts) {
    const cfg = STAGE1_CONFIG.Q03;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("Q03", { envMap: opts.envMap });
    root.add(env.group);

    // 1) 背景の13×13床板と X=+1.1, Z=-3.2 の簡易像を非表示化
    const toHide = [];
    env.group.traverse(function (ch) {
      if (!ch.isMesh) return;
      if (ch.geometry && ch.geometry.type === "PlaneGeometry" && ch.geometry.parameters && ch.geometry.parameters.width === 13 && ch.geometry.parameters.height === 13) {
        toHide.push(ch);
      }
      if (Math.abs(ch.position.x - 1.1) < 0.05 && Math.abs(ch.position.z - (-3.2)) < 0.05) {
        toHide.push(ch);
      }
    });
    toHide.forEach(function (m) { m.visible = false; });

    // 2) 開口部 (0, -4.95) 幅1.8 × 奥行2.2 を抜いた4分割床板
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xb5b8c2, roughness: 0.86 });
    const op = cfg.opening;
    const minX = op.centerX - op.widthX / 2, maxX = op.centerX + op.widthX / 2;
    const minZ = op.centerZ - op.lengthZ / 2, maxZ = op.centerZ + op.lengthZ / 2;
    function addFloorSlab(x0, x1, z0, z1) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), floorMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((x0 + x1) / 2, 0.005, (z0 + z1) / 2);
      root.add(m);
    }
    addFloorSlab(-6.5, 6.5, maxZ, 6.5);
    addFloorSlab(-6.5, 6.5, -6.5, minZ);
    addFloorSlab(-6.5, minX, minZ, maxZ);
    addFloorSlab(maxX, 6.5, minZ, maxZ);

    // 3) 動く床フタ＋階段ピット＋北側Q04地下通路開口＆踊り場
    const trapdoor = new THREE.Mesh(
      new THREE.BoxGeometry(op.widthX - 0.04, 0.16, op.lengthZ - 0.04),
      new THREE.MeshStandardMaterial({ color: 0x9fa3b0, roughness: 0.82 })
    );
    trapdoor.position.set(op.centerX, -0.08, op.centerZ);
    root.add(trapdoor);

    const stairWell = new THREE.Group();
    const wellWallMat = new THREE.MeshStandardMaterial({ color: 0x4b4f5a, roughness: 0.9 });
    const landingY = -op.stepCount * op.stepHeight; // -1.68

    // ピット南壁・西壁（北壁はQ04地下通路へ抜ける開口にするため塞がない！）
    const pitSouth = new THREE.Mesh(new THREE.BoxGeometry(op.widthX + 0.12, 2.2, 0.12), wellWallMat);
    pitSouth.position.set(op.centerX, -1.1, maxZ + 0.04); stairWell.add(pitSouth);
    const pitWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, op.lengthZ + 2.6), wellWallMat);
    pitWest.position.set(minX - 0.06, -1.1, op.centerZ - 1.2); stairWell.add(pitWest);
    const pitEastNorth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 2.5), wellWallMat);
    pitEastNorth.position.set(maxX + 0.06, -1.1, minZ - 1.25); stairWell.add(pitEastNorth);

    // 各段を単一座標定義から生成（段iの上面 = -(i+1)*stepHeight）
    const stepW = op.widthX / op.stepCount;
    for (let i = 0; i < op.stepCount; i++) {
      const topY = -(i + 1) * op.stepHeight;
      const h = Math.max(0.18, topY - (landingY - 0.2));
      const st = new THREE.Mesh(new THREE.BoxGeometry(stepW, h, op.lengthZ - 0.06), wellWallMat);
      st.position.set(maxX - stepW * (i + 0.5), topY - h / 2, op.centerZ);
      stairWell.add(st);
    }

    // 最下段踊り場〜北のQ04地下通路入口へ抜ける床＆石造アーチ枠（Y = -1.68）
    const landingFloor = new THREE.Mesh(new THREE.BoxGeometry(op.widthX + 0.1, 0.2, op.lengthZ + 2.5), wellWallMat);
    landingFloor.position.set(op.centerX, landingY - 0.1, op.centerZ - 1.25);
    stairWell.add(landingFloor);

    // 北側Q04地下通路の開口アーチ＋ほのかな青い誓灯の光
    const archMat = new THREE.MeshStandardMaterial({ color: 0x3b3f4a, roughness: 0.85 });
    const northArch = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.12, 8, 16, Math.PI), archMat);
    northArch.position.set(op.centerX, landingY + 1.15, minZ - 0.1);
    stairWell.add(northArch);
    const q04Glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 1.85),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    q04Glow.position.set(op.centerX, landingY + 0.95, minZ - 2.2);
    stairWell.add(q04Glow);
    root.add(stairWell);

    // 4) PROP_STATUE を X=+1.1, Z=-3.2 に差し替え＆既存背面部品を非表示にして単一受け口へ統一
    const statueObj = global.CastleEscapeItems.createItemOrProp("PROP_STATUE", { envMap: opts.envMap });
    statueObj.group.scale.setScalar(1.36);
    statueObj.group.position.set(1.1, 1.22, -3.2);
    // PROP_STATUE内の既存背面nest/hollowを非表示化して二重受け口を完全解消
    statueObj.group.traverse(function (ch) {
      if (ch.isMesh && ch.position.z < -0.15) ch.visible = false;
    });
    root.add(statueObj.group);

    // 単一の背面受け口（(1.1, 1.30, -3.50)、幅 0.26m）
    const socketGroup = new THREE.Group();
    socketGroup.position.set(cfg.socketPos[0], cfg.socketPos[1], cfg.socketPos[2]);
    const socketRim = new THREE.Mesh(new THREE.TorusGeometry(cfg.socketWidth / 2, 0.025, 10, 20), new THREE.MeshStandardMaterial({ color: 0xc99c3e, roughness: 0.35, metalness: 0.8 }));
    socketGroup.add(socketRim);
    const socketCavity = new THREE.Mesh(new THREE.CylinderGeometry(cfg.socketWidth / 2 - 0.01, cfg.socketWidth / 2 - 0.01, 0.16, 16), new THREE.MeshBasicMaterial({ color: 0x0b0c10 }));
    socketCavity.rotation.x = Math.PI / 2; socketCavity.position.z = 0.07;
    socketGroup.add(socketCavity);
    root.add(socketGroup);

    const altarShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x1a1d26, transparent: true, opacity: 0.32 })
    );
    altarShadow.rotation.x = -Math.PI / 2;
    altarShadow.position.set(1.1, 0.02, -2.55);
    root.add(altarShadow);

    // 5) 単一の覗き錘 I11（幅0.23m、吊り環上・レンズ下）— 手持ちから受け口まで連続移動（飛び0.00m！）
    const weightObj = global.CastleEscapeItems.createItemOrProp("I11", { envMap: opts.envMap });
    weightObj.group.scale.setScalar(0.35);
    // 実モデルの持ち位置（幅約0.23mの卵を右手指で支える背面 -Z 側表面: ローカル z = -0.30 → ワールド約-0.105m）
    const weightGripAnchor = new THREE.Group();
    weightGripAnchor.position.set(0, 0.0, -0.30);
    weightObj.group.add(weightGripAnchor);
    root.add(weightObj.group);

    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = false;
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    const dbg = createDebugLayer();
    dbg.addPath([cfg.heroPath.enter, cfg.heroPath.eastFlank, cfg.heroPath.behindRow, cfg.heroPath.insertPos, cfg.heroPath.stairEdge, cfg.heroPath.stairBottom, cfg.heroPath.q04PortalExit], 0x38bdf8, 0.08);
    dbg.addPoint(cfg.socketPos[0], cfg.socketPos[1], cfg.socketPos[2], 0xec4899, 0.09);
    dbg.addPoint(cfg.q04Handoff.q03ExitPos[0], cfg.q04Handoff.q03ExitPos[1] + 0.15, cfg.q04Handoff.q03ExitPos[2], 0x22c55e, 0.14);
    root.add(dbg.group);

    const state = {
      variant: "success",
      playing: false,
      time: 0,
      statusText: "初期状態：南入口 (0, +5.7)",
      customGameState: null
    };

    const _vW = new THREE.Vector3();
    const _vS = new THREE.Vector3(cfg.socketPos[0], cfg.socketPos[1], cfg.socketPos[2]);

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      const hp = gs.heroPos || cfg.heroPath.enter;
      const hy = (gs.heroY !== undefined) ? gs.heroY : (gs.floorOpen ? getQ03StairSurfaceY(hp[0], hp[1]) : 0);
      hero.rig.position.set(hp[0], hy, hp[1]);
      hero.rig.rotation.y = (gs.heroYaw !== undefined) ? gs.heroYaw : 0;
      trapdoor.visible = !gs.floorOpen;
      trapdoor.position.y = gs.floorOpen ? -1.92 : -0.08;
      altarShadow.scale.y = gs.floorOpen ? 1.25 : 1.0;

      if (gs.weightInserted) {
        weightObj.group.visible = true;
        weightObj.group.position.copy(_vS);
        weightObj.group.rotation.set(0, 0, 0);
      } else if (gs.hasWeight) {
        weightObj.group.visible = true;
        hero.rig.updateWorldMatrix(true, true);
        hero.charObj.rightArm.socket.getWorldPosition(_vW);
        weightObj.group.position.copy(_vW);
        weightObj.group.rotation.set(0, 0, 0);
      } else {
        weightObj.group.visible = false;
      }
      state.statusText = "保存状態復元：床" + (gs.floorOpen ? "開放済" : "閉鎖") + "／錘" + (gs.weightInserted ? "収容済" : (gs.hasWeight ? "所持" : "なし"));
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) {
        applyGameStateSnapshot(state.customGameState);
        return;
      }
      const T = cfg.timings;
      const v = state.variant;
      charApi.applyPose(hero.charObj, "stand", sec);
      hero.rig.position.y = 0;
      trapdoor.position.y = -0.08;
      trapdoor.visible = true;
      altarShadow.scale.y = 1.0;
      weightObj.group.rotation.set(0, 0, 0);

      if (v === "wrongStatue") {
        hero.rig.position.set(cfg.heroPath.wrongStatuePos[0], 0, cfg.heroPath.wrongStatuePos[1]);
        hero.rig.rotation.y = 0;
        hero.charObj.rightArm.shoulder.rotation.set(-0.95, 0, 0.15);
        hero.charObj.rightArm.elbow.rotation.x = -0.6;
        hero.rig.updateWorldMatrix(true, true);
        hero.charObj.rightArm.socket.getWorldPosition(_vW);
        weightObj.group.visible = true;
        weightObj.group.position.copy(_vW);
        state.statusText = "冠あり像（X=-1.1）：受け口なし・床は閉じたまま";
        return;
      }

      // アプローチ：南入口 → 東側 → 像の後ろ → 差込位置
      if (sec < T.approach) {
        const p = sec / T.approach;
        let hx, hz, hyaw;
        if (p < 0.42) {
          const q = smoothstep(p / 0.42);
          hx = lerp(cfg.heroPath.enter[0], cfg.heroPath.eastFlank[0], q);
          hz = lerp(cfg.heroPath.enter[1], cfg.heroPath.eastFlank[1], q);
          hyaw = Math.atan2(cfg.heroPath.eastFlank[0] - cfg.heroPath.enter[0], cfg.heroPath.eastFlank[1] - cfg.heroPath.enter[1]);
        } else if (p < 0.65) {
          const q = smoothstep((p - 0.42) / 0.23);
          hx = cfg.heroPath.eastFlank[0];
          hz = lerp(cfg.heroPath.eastFlank[1], cfg.heroPath.behindRow[1], q);
          hyaw = Math.PI;
        } else {
          const q = smoothstep((p - 0.65) / 0.35);
          hx = lerp(cfg.heroPath.behindRow[0], cfg.heroPath.insertPos[0], q);
          hz = lerp(cfg.heroPath.behindRow[1], cfg.heroPath.insertPos[1], q);
          hyaw = lerpAngle(-Math.PI / 2, 0, smoothstep((q - 0.7) / 0.3));
        }
        hero.rig.position.set(hx, 0, hz);
        hero.rig.rotation.y = hyaw;
        charApi.applyPose(hero.charObj, "walk", sec * 2.6);
        hero.rig.updateWorldMatrix(true, true);
        hero.charObj.rightArm.socket.getWorldPosition(_vW);
        weightObj.group.visible = (v !== "noWeight");
        weightObj.group.position.copy(_vW);
        state.statusText = "台座を避けて東側から冠なき像の背面へ接近中";
        return;
      }

      let t = sec - T.approach;
      // 差込位置（受け口まで腕が確実に届く +Z 寄りへ微調整せず、IKで腕を伸ばして到達確認）
      hero.rig.position.set(cfg.heroPath.insertPos[0], 0, cfg.heroPath.insertPos[1]);
      hero.rig.rotation.y = 0;
      hero.rig.updateWorldMatrix(true, true);

      if (v === "noWeight") {
        weightObj.group.visible = false;
        solveArmIK(hero.charObj.rightArm, new THREE.Vector3(_vS.x, _vS.y, _vS.z - 0.14), new THREE.Vector3(-0.4, -0.4, -0.2));
        state.statusText = "錘なし：空の単一受け口を確認（床は閉じたまま）";
        return;
      }

      // 1) 覗き錘を連続して受け口 (1.1, 1.30, -3.50) へ運び、最後の0.10mをゆっくり収めて座らせてから手を離す (0.55s)
      weightObj.group.visible = true;
      if (t < T.insertWeight) {
        const p = smoothstep(t / T.insertWeight);
        // 上体を軽く前傾させて右手IKが受け口まで余裕をもって届くようにする
        hero.charObj.upperBody.rotation.x = 0.24 * Math.min(1, p * 2.2);
        hero.rig.updateWorldMatrix(true, true);
        hero.charObj.rightArm.socket.getWorldPosition(_vW);
        const startPos = _vW.clone().add(new THREE.Vector3(0, 0, 0.105));
        const preSocket = new THREE.Vector3(_vS.x, _vS.y, _vS.z - 0.10);
        const curCenter = new THREE.Vector3();
        if (p < 0.55) {
          curCenter.lerpVectors(startPos, preSocket, smoothstep(p / 0.55));
        } else {
          curCenter.lerpVectors(preSocket, _vS, smoothstep((p - 0.55) / 0.45));
        }
        weightObj.group.position.copy(curCenter);
        weightObj.group.updateWorldMatrix(true, true);
        // 実モデルの持ち位置 weightGripAnchor に右手をIK接触させる！
        const gripW = new THREE.Vector3();
        weightGripAnchor.getWorldPosition(gripW);
        solveArmIK(hero.charObj.rightArm, gripW, new THREE.Vector3(-0.4, -0.4, -0.2));
        state.statusText = p < 0.55 ? "右手で錘を支え受け口手前0.10mへ運ぶ" : "最後の0.10mを右手で支えたまま受け口へ収める (0.55秒)";
        return;
      }

      // 収容完了：錘は受け口に固定、右手は自然に下ろす
      weightObj.group.position.copy(_vS);
      t -= T.insertWeight;

      // 2) 祭壇の影が指一本ぶん伸びる (0.25s)
      if (t < T.shadowShift) {
        const p = smoothstep(t / T.shadowShift);
        altarShadow.scale.y = 1.0 + p * 0.25;
        state.statusText = "祭壇の影が指一本ぶん伸びる (0.25秒)";
        return;
      }
      altarShadow.scale.y = 1.25;
      t -= T.shadowShift;

      // 3) 床が下がって地下階段が現れる (1.05s)
      if (t < T.openFloor) {
        const p = smoothstep(t / T.openFloor);
        trapdoor.position.y = lerp(-0.08, -1.92, p);
        trapdoor.visible = p < 0.92;
        state.statusText = "床が開き、東端から降りる地下階段と北Q04開口が出現 (1.05秒)";
        return;
      }
      trapdoor.visible = false;
      t -= T.openFloor;

      // 4) 段差手前 → 各段の上面Yに厳密一致して降下 → 北のQ04接続口 (-0.30, -1.68, -7.15) へ抜ける
      const p = smoothstep(t / T.descend);
      if (p < 0.22) {
        const q = p / 0.22;
        hero.rig.position.set(lerp(cfg.heroPath.insertPos[0], cfg.heroPath.stairEdge[0], q), 0, lerp(cfg.heroPath.insertPos[1], cfg.heroPath.stairEdge[1], q));
        hero.rig.rotation.y = lerpAngle(0, -Math.PI / 2, q);
        charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = "地下階段の東端手前まで移動";
      } else if (p < 0.72) {
        const q = (p - 0.22) / 0.50;
        const hx = lerp(cfg.heroPath.stairEdge[0], cfg.heroPath.stairBottom[0], q);
        const hy = getQ03StairSurfaceY(hx, cfg.heroPath.stairEdge[1]); // 直下の階段上面Yと厳密一致！
        hero.rig.position.set(hx, hy, cfg.heroPath.stairEdge[1]);
        hero.rig.rotation.y = -Math.PI / 2;
        charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = "外側グループYを各段上面と一致させて地下階段を降下中 (Y=" + hy.toFixed(2) + ")";
      } else {
        const q = (p - 0.72) / 0.28;
        const hx = q < 0.5 ? cfg.heroPath.stairBottom[0] : lerp(cfg.heroPath.stairBottom[0], cfg.heroPath.q04PortalExit[0], (q - 0.5) * 2);
        const hz = lerp(cfg.heroPath.stairBottom[1], cfg.heroPath.q04PortalExit[1], q);
        hero.rig.position.set(hx, landingY, hz);
        hero.rig.rotation.y = lerpAngle(-Math.PI / 2, Math.PI, Math.min(1, q * 2.0));
        if (p < 0.98) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = p >= 0.98
          ? "完了：最下段踊り場(Y=-1.68)から北のQ04地下通路入口へ到達"
          : "最下段踊り場から北のQ04地下通路開口へ移動中";
      }
    }

    const totalDuration = cfg.timings.approach + cfg.timings.insertWeight + cfg.timings.shadowShift + cfg.timings.openFloor + cfg.timings.descend;

    return {
      id: "Q03",
      config: cfg,
      env: env,
      root: root,
      _inspect: { hero: hero, weightObj: weightObj, weightGripAnchor: weightGripAnchor, socketPos: _vS, trapdoor: trapdoor, getStairSurfaceY: getQ03StairSurfaceY },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) {
        state.customGameState = null; state.holdingSnapshot = false;
        state.playing = false;
        if (ph === "initial") state.time = 0;
        else if (ph === "mid") state.time = cfg.timings.approach + cfg.timings.insertWeight;
        else state.time = totalDuration;
        applyTimeline(state.time);
      },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) { return cfg.cameras[name] || cfg.cameras.wide; },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return totalDuration; },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) {
          state.time += dt;
          if (state.time >= totalDuration) { state.time = totalDuration; state.playing = false; }
        }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  function createSceneController(sceneId, options) {
    const opts = options || {};
    let ctrl = null;
    if (sceneId === "Q01") ctrl = buildQ01Controller(opts);
    else if (sceneId === "Q02") ctrl = buildQ02Controller(opts);
    else ctrl = buildQ03Controller(opts);
    if (opts.scene) opts.scene.add(ctrl.root);
    return ctrl;
  }

  global.CastleEscapeStage1 = {
    STAGE1_CONFIG: STAGE1_CONFIG,
    buildSplitCollar: buildSplitCollar,
    getQ03StairSurfaceY: getQ03StairSurfaceY,
    createSceneController: createSceneController
  };
})(window);
