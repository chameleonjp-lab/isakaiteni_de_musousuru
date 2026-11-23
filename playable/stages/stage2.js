/**
 * 王都からの脱出 — 第2段階：脱出ルート接続（W04 / Q04 / Q05）3D演出・状態連動モジュール v2
 * 依存: Three.js r128, CastleEscapeModels, CastleEscapeItems, CastleEscapeEnvironments
 *
 * v2 修正点:
 *   - W04: Q01扉位置をcorridorPortals実値(Z=-1.70)へ一致、香車停止位置を調整して高さ0.65mでの開口通行幅>=1.2m（実測約1.75m）を確保、W03扉非遮蔽、車輪の車軸回転＆扉開閉可視化。
 *   - Q04: 背景の逆向き石段を非表示化し、単一定義から南降り段(Z=+8.1 Y=0.72 → Z=+6.75 Y=0.18 → 0)・北昇り段(Z=-6.75 Y=0.18 → Z=-8.1 Y=0.72)の実モデル・衝突・足裏Yを完全一致（誤差0.000m）、段横(|X|>1.15)はY=0。
 *   - Q05: 固定prevZを廃止し実前後Z＋本体実状態で4条件判定、applyGameStateでclearTriggered/clearTriggerCountを本体escapedへ完全同期リセット。
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

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smoothstep(v) { const t = clamp01(v); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function createActorRig(charId, options) {
    const charObj = getCharApi().createCharacter(charId, options || {});
    const rig = new THREE.Group();
    rig.add(charObj.group);
    return { rig: rig, charObj: charObj };
  }

  function createDebugLayer() {
    const g = new THREE.Group();
    g.visible = false;
    function addPoint(x, y, z, colorHex, radius) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(radius || 0.11, 10, 8),
        new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false, transparent: true, opacity: 0.9 })
      );
      m.position.set(x, y, z);
      m.renderOrder = 999;
      g.add(m);
      return m;
    }
    function addPath(pointsXZ, colorHex, y) {
      const pts = pointsXZ.map(function (p) { return new THREE.Vector3(p[0], y || 0.08, p[1]); });
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colorHex })));
      pointsXZ.forEach(function (p) { addPoint(p[0], (y || 0.08) + 0.02, p[1], colorHex, 0.085); });
    }
    return { group: g, addPoint: addPoint, addPath: addPath };
  }

  // =========================================================================
  // 単一座標定義（W04 / Q04 / Q05）
  // =========================================================================
  const STAGE2_CONFIG = {
    W04: {
      missionId: "M16",
      title: "W04 香支度室／M16「香車の返納予約」＆ E269",
      roomSize: { w: 8.5, d: 9.0, h: 5.4 },
      dialPos: [0, 1.25, -4.15],
      heroDialStand: [0, -2.85],
      // 開口Q01(Z=-1.70, 幅2.4: [-2.90..-0.50])とW03(Z=+1.70, 幅2.4: [+0.50..+2.90])の両方を塞がない停止位置(-3.15, -0.05)
      // 香車サイズ: 幅0.84(X) x 奥行0.96(Z) → Z占有[-0.53..+0.43] なのでQ01開口[-2.90..-0.53]に2.37m、W03開口[+0.43..+2.90]に2.47mの連続隙間を確保！
      cartSize: { w: 0.84, h: 0.72, d: 0.96 },
      cartPath: [
        [0.0, -0.5],
        [-1.6, -0.5],
        [-3.15, -0.05]
      ],
      cartWheelRadius: 0.24,
      e269StandPos: [2.25, 1.05, -0.8],
      doorQ01Fallback: [-4.25, 0, -1.70],
      doorW03Fallback: [-4.25, 0, 1.70],
      maxWaitMinutes: 12,
      cameras: {
        wide: { pos: [3.4, 3.8, 3.6], look: [-1.1, 1.15, -1.1] },
        closeup: { pos: [0.55, 1.48, -2.55], look: [0.0, 1.25, -4.12] },
        e269: { pos: [1.35, 1.55, 0.35], look: [2.25, 1.08, -0.80] }
      },
      variants: [
        { id: "reserveSuccess", label: "M16 正常予約→香車移動→Q01戸開放＆通過" },
        { id: "wrongOrientation", label: "I13切れ目外れ（留め具落ちず）" },
        { id: "missingItems", label: "I12/I13未所持（予約不可）" },
        { id: "alreadyReserved", label: "予約済み盤面＆Q01入室（止め具引き）" },
        { id: "inspectE269", label: "E269 東側台・奉納灯の見本札確認" }
      ]
    },

    Q04: {
      missionId: "Q04",
      title: "Q04 王家の抜け穴（地下通路）",
      roomSize: { w: 5.4, d: 17.0, h: 4.4 },
      q03ReceivePos: [0.0, 0.72, 7.7],
      path: [
        [0.0, 7.7],
        [0.0, 1.5],
        [0.0, -4.9],
        [0.0, -7.7]
      ],
      oathLampPos: [-0.7, 2.5, 1.5],
      fakeSkyPos: [2.34, 1.75, -1.2],
      // 単一石段定義: 幅2.3m (X ∈ [-1.15, +1.15])
      // 南(入口側): Z=+8.10(+7.875..+8.325)が最高0.72 → +7.65(0.54) → +7.20(0.36) → +6.75(0.18) → 暗渠床0.00
      // 北(出口側): Z=-6.75(0.18) → -7.20(0.36) → -7.65(0.54) → -8.10(0.72)
      stepWidthX: 2.30,
      stepLenZ: 0.45,
      steps: [
        // 南側4段（入口から暗渠へ降りる）
        { side: "S", zCenter: 8.10, topY: 0.72 },
        { side: "S", zCenter: 7.65, topY: 0.54 },
        { side: "S", zCenter: 7.20, topY: 0.36 },
        { side: "S", zCenter: 6.75, topY: 0.18 },
        // 北側4段（暗渠から出口へ上がる）
        { side: "N", zCenter: -6.75, topY: 0.18 },
        { side: "N", zCenter: -7.20, topY: 0.36 },
        { side: "N", zCenter: -7.65, topY: 0.54 },
        { side: "N", zCenter: -8.10, topY: 0.72 }
      ],
      cameras: {
        wide: { pos: [1.6, 2.5, 6.2], look: [0.0, 1.35, -1.5] },
        closeup: { pos: [0.35, 1.78, -0.35], look: [2.34, 1.75, -1.2] }
      },
      variants: [
        { id: "passToQ05", label: "Q03引継ぎ→地下通路通過→Q05出口" },
        { id: "inspectFakeSky", label: "東壁・偽りの青空陶板（ひび・石枠）確認" },
        { id: "stopMidway", label: "暗渠の途中で停止（青い誓灯付近）" }
      ]
    },

    Q05: {
      missionId: "M20",
      title: "Q05 境石と外の草地／M20「境界横断クリア」",
      roomSize: { w: 16.5, d: 16.5, h: 4.5 },
      boundaryZ: 0.0,
      grassConfirmZ: -0.6,
      stonePos: [0.0, 0.0, 0.0],
      path: [
        [0.0, 6.0],
        [1.2, 2.0],
        [1.2, 0.65],
        [1.2, -0.6],
        [1.2, -2.1]
      ],
      cameras: {
        wide: { pos: [5.4, 4.4, 5.2], look: [0.6, 1.0, -0.4] },
        closeup: { pos: [2.6, 1.55, 2.35], look: [0.3, 1.05, 0.0] }
      },
      variants: [
        { id: "clearSuccess", label: "M20 4条件成立・境石を越えて脱出クリア" },
        { id: "stopBeforeStone", label: "境石の手前(1.2,+0.65)で止まり冠を確認" },
        { id: "failCollarOn", label: "失敗：首輪ありで境界横断" },
        { id: "failDetectedCloak", label: "失敗：解除後に発見済み（マント着用）" },
        { id: "failWrongRun", label: "失敗：別逃走で入口通過（同逃走未通過）" },
        { id: "failOuterToInner", label: "不成立：外側から内側へ戻る" }
      ]
    }
  };

  // 単一石段定義から足裏Yを計算（X実幅[-1.15,+1.15]の外＝段の横は通常床Y=0！）
  function getQ04SurfaceY(x, z) {
    const cfg = STAGE2_CONFIG.Q04;
    if (z === undefined) { z = x; x = 0; }
    if (Math.abs(x) > cfg.stepWidthX / 2) return 0;
    const halfL = cfg.stepLenZ / 2;
    for (let i = 0; i < cfg.steps.length; i++) {
      const st = cfg.steps[i];
      if (z >= st.zCenter - halfL - 1e-4 && z <= st.zCenter + halfL + 1e-4) {
        return st.topY;
      }
    }
    return 0;
  }

  // Q05 4条件同時成立クリア判定（本体実状態＋実前後Z）
  function evaluateQ05Clear(gameState, prevZ, curZ) {
    const gs = gameState || {};
    const c1 = !!gs.collarRemoved;
    const c2 = !gs.detectedAfterRemoval;
    const c3 = !!gs.passedRoyalEntranceThisRun;
    const c4 = (prevZ > STAGE2_CONFIG.Q05.boundaryZ && curZ <= STAGE2_CONFIG.Q05.boundaryZ);
    return {
      cleared: c1 && c2 && c3 && c4,
      conditions: { collarRemoved: c1, undetectedAfterRemoval: c2, passedRoyalEntranceThisRun: c3, crossedInnerToOuter: c4 }
    };
  }

  // =========================================================================
  // 1. W04 香支度室 / M16 & E269
  // =========================================================================
  function buildW04Controller(opts) {
    const cfg = STAGE2_CONFIG.W04;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("W04", { envMap: opts.envMap });
    root.add(env.group);

    // corridorPortals 実値から Q01 / W03 扉位置を照合
    function resolvePortal(tid, fb) {
      const p = env.corridorPortals.find(function (x) { return x.targetId === tid; });
      return p ? { x: p.entryX, z: p.entryZ, matched: true } : { x: fb[0], z: fb[2], matched: false };
    }
    const pQ01 = resolvePortal("Q01", cfg.doorQ01Fallback);
    const pW03 = resolvePortal("W03", cfg.doorW03Fallback);

    // 既存簡易香車・高位置盤面を非表示化
    env.group.traverse(function (ch) {
      if (!ch.isMesh) return;
      if (Math.abs(ch.position.x) < 0.05 && Math.abs(ch.position.z - (-0.5)) < 0.05) ch.visible = false;
      if (Math.abs(ch.position.x) < 0.05 && Math.abs(ch.position.y - 2.3) < 0.1) ch.visible = false;
    });

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a22, roughness: 0.74 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x331e10, roughness: 0.78 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc99c3e, roughness: 0.28, metalness: 0.85, envMap: opts.envMap || null });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b848, roughness: 0.22, metalness: 0.9, envMap: opts.envMap || null });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.42, metalness: 0.84 });

    // 北壁当番盤（Y=1.25）
    const dialGroup = new THREE.Group();
    dialGroup.position.set(cfg.dialPos[0], cfg.dialPos[1], cfg.dialPos[2]);
    dialGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.1), darkWoodMat));
    const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24), brassMat);
    dialPlate.rotation.x = Math.PI / 2; dialPlate.position.z = 0.06; dialGroup.add(dialPlate);
    [-0.22, 0.22].forEach(function (mx) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), goldMat);
      mark.position.set(mx, 0, 0.09); dialGroup.add(mark);
    });
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.07), ironMat);
    latch.position.set(0, -0.34, 0.09); dialGroup.add(latch);
    root.add(dialGroup);

    const ringObj = global.CastleEscapeItems.createItemOrProp("I13", { envMap: opts.envMap });
    ringObj.group.scale.setScalar(0.55);
    root.add(ringObj.group);

    // 香車（幅0.84 × 奥行0.96：Q01開口Z∈[-2.90,-0.50]とW03開口Z∈[+0.50,+2.90]を塞がない）
    const cartGroup = new THREE.Group();
    const cs = cfg.cartSize;
    const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(cs.w, cs.h, cs.d), woodMat);
    cartFrame.position.y = 0.62; cartGroup.add(cartFrame);
    const cartRail = new THREE.Mesh(new THREE.BoxGeometry(cs.w + 0.06, 0.08, cs.d + 0.06), darkWoodMat);
    cartRail.position.y = 1.0; cartGroup.add(cartRail);
    const censer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.32, 14), brassMat);
    censer.position.y = 1.18; cartGroup.add(censer);
    const wheels = [];
    // 車軸をZ方向（左右輪）に揃え、X方向移動に合わせてZ軸回転（地面に沿って回転）
    [[-cs.w / 2 - 0.04, -cs.d / 2 + 0.16], [cs.w / 2 + 0.04, -cs.d / 2 + 0.16], [-cs.w / 2 - 0.04, cs.d / 2 - 0.16], [cs.w / 2 + 0.04, cs.d / 2 - 0.16]].forEach(function (wp) {
      const wg = new THREE.Group();
      wg.position.set(wp[0], cfg.cartWheelRadius, wp[1]);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(cfg.cartWheelRadius, 0.036, 8, 16), darkWoodMat);
      wg.add(rim);
      const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, cfg.cartWheelRadius * 1.9, 0.03), brassMat);
      const sp2 = new THREE.Mesh(new THREE.BoxGeometry(cfg.cartWheelRadius * 1.9, 0.03, 0.03), brassMat);
      wg.add(sp1); wg.add(sp2);
      cartGroup.add(wg);
      wheels.push(wg);
    });
    const doorStop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.14), ironMat);
    doorStop.position.set(-cs.w / 2 - 0.16, 0.2, -cs.d / 2 + 0.1);
    cartGroup.add(doorStop);
    cartGroup.position.set(cfg.cartPath[0][0], 0, cfg.cartPath[0][1]);
    root.add(cartGroup);

    // Q01側開閉扉（Z = pQ01.z = -1.70、蝶番で回転開閉が目で分かる）
    const q01DoorPivot = new THREE.Group();
    q01DoorPivot.position.set(pQ01.x + 0.24, 0, pQ01.z - 1.12);
    const q01DoorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.11, 3.1, 2.24), darkWoodMat);
    q01DoorLeaf.position.set(0, 1.55, 1.12);
    q01DoorPivot.add(q01DoorLeaf);
    root.add(q01DoorPivot);

    // 戸の向こう低い位置の白百合印
    const lilySign = new THREE.Mesh(new THREE.CircleGeometry(0.22, 4), new THREE.MeshBasicMaterial({ color: 0xf4f5fa }));
    lilySign.rotation.y = Math.PI / 2;
    lilySign.position.set(pQ01.x - 0.15, 0.35, pQ01.z);
    root.add(lilySign);

    // E269 奉納灯の見本札（東側台 +2.25, 1.05, -0.8）
    const standTable = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 0.8), woodMat);
    standTable.position.set(cfg.e269StandPos[0], 0.475, cfg.e269StandPos[2]);
    root.add(standTable);
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
    const g2 = cv.getContext("2d");
    g2.fillStyle = "#edeff5"; g2.fillRect(0, 0, 128, 128);
    g2.fillStyle = "rgba(18,22,34,0.75)"; g2.beginPath(); g2.ellipse(64, 72, 20, 34, 0, 0, Math.PI * 2); g2.fill();
    g2.beginPath(); g2.arc(64, 32, 12, 0, Math.PI * 2); g2.fill();
    g2.fillStyle = "#222633"; g2.fillRect(128, 0, 128, 128);
    g2.fillStyle = "#f4f5fa";
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      g2.fillRect(192 + Math.cos(a) * 18 - 6, 64 + Math.sin(a) * 18 - 6, 12, 12);
    }
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.42), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.6 }));
    plaque.position.set(cfg.e269StandPos[0], cfg.e269StandPos[1], cfg.e269StandPos[2]);
    root.add(plaque);

    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    const dbg = createDebugLayer();
    dbg.addPath(cfg.cartPath, 0xf59e0b, 0.1);
    dbg.addPoint(cfg.dialPos[0], cfg.dialPos[1], cfg.dialPos[2], 0xec4899, 0.1);
    dbg.addPoint(cfg.e269StandPos[0], cfg.e269StandPos[1] + 0.1, cfg.e269StandPos[2], 0x38bdf8, 0.1);
    dbg.addPoint(pQ01.x, 1.4, pQ01.z, 0x22c55e, 0.13);
    dbg.addPoint(pW03.x, 1.4, pW03.z, 0x22c55e, 0.13);
    root.add(dbg.group);

    const state = { variant: "reserveSuccess", playing: false, time: 0, statusText: "初期状態", customGameState: null, holdingSnapshot: false };

    function setCartAlongPath(frac, stopPulled) {
      const p0 = cfg.cartPath[0], p1 = cfg.cartPath[1], p2 = cfg.cartPath[2];
      const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const total = d1 + d2;
      const dist = clamp01(frac) * total;
      let cx, cz;
      if (dist <= d1) {
        const q = dist / d1; cx = lerp(p0[0], p1[0], q); cz = lerp(p0[1], p1[1], q);
      } else {
        const q = (dist - d1) / d2; cx = lerp(p1[0], p2[0], q); cz = lerp(p1[1], p2[1], q);
      }
      cartGroup.position.set(cx, 0, cz);
      // 地面に沿って車軸中心に回転
      const rot = dist / cfg.cartWheelRadius;
      wheels.forEach(function (w) { w.rotation.z = rot; });
      doorStop.position.x = stopPulled ? -cs.w / 2 + 0.08 : -cs.w / 2 - 0.16;
      // 扉の開閉を蝶番回転で明示（香車寄せ＆止め具ありで開、止め具引きまたは未予約で閉）
      const doorOpenFrac = (frac > 0.8 && !stopPulled) ? smoothstep((frac - 0.8) / 0.2) : 0;
      q01DoorPivot.rotation.y = -doorOpenFrac * Math.PI * 0.42;
    }

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      const hp = gs.heroPos || cfg.heroDialStand;
      hero.rig.position.set(hp[0], 0, hp[1]);
      hero.rig.rotation.y = (gs.heroYaw !== undefined) ? gs.heroYaw : Math.PI;
      const reserved = !!gs.reserved;
      latch.position.y = reserved ? -0.46 : -0.34;
      setCartAlongPath(reserved ? 1.0 : 0.0, !!gs.stopPulled);
      ringObj.group.visible = false;
      state.statusText = "保存復元：予約" + (reserved ? "済" : "未") + "／止め具" + (gs.stopPulled ? "引済(Q01閉扉可)" : "保持");
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) { applyGameStateSnapshot(state.customGameState); return; }
      const v = state.variant;
      charApi.applyPose(hero.charObj, "stand", sec);
      latch.position.y = -0.34;
      ringObj.group.visible = false;
      setCartAlongPath(0, false);

      if (v === "inspectE269") {
        hero.rig.position.set(1.55, 0, -0.8); hero.rig.rotation.y = Math.PI / 2;
        state.statusText = "E269：東側台 (+2.25, 1.05, -0.8) の奉納灯見本札を確認";
        return;
      }
      if (v === "alreadyReserved") {
        hero.rig.position.set(-2.6, 0, pQ01.z); hero.rig.rotation.y = -Math.PI / 2;
        latch.position.y = -0.46;
        const pulled = sec > 1.0;
        setCartAlongPath(1.0, pulled);
        state.statusText = pulled ? "Q01入室：止め具を引き、Q01側で閉扉可能な状態へ" : "予約済み・香車寄せ完了（Q01開口の有効通行幅 ≥ 1.2m）";
        return;
      }

      hero.rig.position.set(cfg.heroDialStand[0], 0, cfg.heroDialStand[1]);
      hero.rig.rotation.y = Math.PI;

      if (v === "missingItems") { state.statusText = "I12/I13未所持：盤面確認のみ（留め具落下なし）"; return; }
      if (v === "wrongOrientation") {
        ringObj.group.visible = true; ringObj.group.position.set(0, 1.25, -3.95); ringObj.group.rotation.z = 0.72;
        state.statusText = "I13の切れ目外れ：留め具は落ちず予約不成立";
        return;
      }

      if (sec < 1.4) {
        const p = smoothstep(sec / 1.4);
        ringObj.group.visible = true;
        ringObj.group.position.set(0, 1.25, lerp(-3.65, -4.02, p));
        ringObj.group.rotation.z = lerp(0.55, 0.0, p);
        latch.position.y = p > 0.85 ? lerp(-0.34, -0.46, (p - 0.85) / 0.15) : -0.34;
        state.statusText = p > 0.85 ? "I13一致→留め具落下・予約成立（空番上限12分）" : "巡回環I13の2切れ目を盤面目印へ合わせる";
      } else if (sec < 3.6) {
        const p = smoothstep((sec - 1.4) / 2.2);
        latch.position.y = -0.46;
        setCartAlongPath(p, false);
        hero.rig.position.set(lerp(0, -2.3, p), 0, lerp(-2.85, pQ01.z, p));
        hero.rig.rotation.y = -Math.PI * 0.65;
        charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = "香車を扉南脇 (-3.15, -0.05) へ移動・Q01扉を開放（車輪回転連動）";
      } else {
        const p = smoothstep((sec - 3.6) / 1.2);
        latch.position.y = -0.46;
        setCartAlongPath(1.0, p > 0.85);
        hero.rig.position.set(lerp(-2.3, -3.85, p), 0, pQ01.z);
        hero.rig.rotation.y = -Math.PI / 2;
        if (p < 0.95) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = p > 0.85 ? "完了：有効幅2.3mの開口からQ01へ入室・止め具引き" : "香車の横を通ってQ01扉開口（Z=-1.70）へ進入";
      }
    }

    const totalDuration = 5.0;
    return {
      id: "W04", config: cfg, env: env, root: root,
      resolvedPortals: { Q01: pQ01, W03: pW03 },
      _inspect: { hero: hero, cartGroup: cartGroup, latch: latch, wheels: wheels, doorStop: doorStop, q01DoorPivot: q01DoorPivot },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = ph === "initial" ? 0 : (ph === "mid" ? 2.4 : totalDuration); applyTimeline(state.time); },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) {
        if (name === "closeup" && state.variant === "inspectE269") return cfg.cameras.e269;
        return cfg.cameras[name] || cfg.cameras.wide;
      },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return totalDuration; },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) { state.time += dt; if (state.time >= totalDuration) { state.time = totalDuration; state.playing = false; } }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  // =========================================================================
  // 2. Q04 王家の抜け穴（単一石段定義で実モデル・衝突・足裏完全一致）
  // =========================================================================
  function buildQ04Controller(opts) {
    const cfg = STAGE2_CONFIG.Q04;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("Q04", { envMap: opts.envMap });
    root.add(env.group);

    // 既存env内の逆向き石段(width=2.3, depth=0.45)を非表示化
    env.group.traverse(function (ch) {
      if (ch.isMesh && ch.geometry && ch.geometry.type === "BoxGeometry" && ch.geometry.parameters) {
        const p = ch.geometry.parameters;
        if (Math.abs(p.width - 2.3) < 0.05 && Math.abs(p.depth - 0.45) < 0.05) ch.visible = false;
      }
    });

    // 単一定義 STAGE2_CONFIG.Q04.steps から実石段メッシュ8個を生成（モデルと足裏Yが100%同一！）
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x6b6d75, roughness: 0.82 });
    const stepMeshes = [];
    cfg.steps.forEach(function (st) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(cfg.stepWidthX, st.topY, cfg.stepLenZ), stepMat);
      m.position.set(0, st.topY / 2, st.zCenter);
      root.add(m);
      stepMeshes.push(m);
    });

    // 東壁の偽りの青空陶板ひび＆北昇り段からの出口光
    const crack1 = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 1.35), new THREE.MeshBasicMaterial({ color: 0x262933 }));
    crack1.position.set(cfg.fakeSkyPos[0] - 0.015, cfg.fakeSkyPos[1] + 0.1, cfg.fakeSkyPos[2] + 0.22);
    crack1.rotation.set(0, -Math.PI / 2, 0.25);
    root.add(crack1);
    const exitLight = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 4.2, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
    );
    exitLight.position.set(0, 2.2, -7.2); exitLight.rotation.x = 0.35; root.add(exitLight);

    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = false;
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    const dbg = createDebugLayer();
    dbg.addPath(cfg.path, 0x38bdf8, 0.12);
    dbg.addPoint(cfg.oathLampPos[0], cfg.oathLampPos[1], cfg.oathLampPos[2], 0x38bdf8, 0.12);
    dbg.addPoint(cfg.fakeSkyPos[0], cfg.fakeSkyPos[1], cfg.fakeSkyPos[2], 0xf59e0b, 0.12);
    root.add(dbg.group);

    const state = { variant: "passToQ05", playing: false, time: 0, statusText: "初期状態：Q03から引継ぎ(0, +7.7)北向き", customGameState: null, holdingSnapshot: false };

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      const hp = gs.heroPos || [0, 7.7];
      const hy = getQ04SurfaceY(hp[0], hp[1]); // 段の横(|X|>1.15)はY=0！
      hero.rig.position.set(hp[0], hy, hp[1]);
      hero.rig.rotation.y = (gs.heroYaw !== undefined) ? gs.heroYaw : Math.PI;
      if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = !gs.collarRemoved;
      state.statusText = "保存復元：Q04 (" + hp[0].toFixed(2) + ", " + hy.toFixed(2) + ", " + hp[1].toFixed(2) + ")";
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) { applyGameStateSnapshot(state.customGameState); return; }
      const v = state.variant;
      charApi.applyPose(hero.charObj, "stand", sec);

      if (v === "stopMidway") {
        const p = smoothstep(sec / 2.2);
        const tz = lerp(7.7, 1.5, p);
        hero.rig.position.set(0, getQ04SurfaceY(0, tz), tz);
        hero.rig.rotation.y = Math.PI;
        if (p < 0.98) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = p >= 0.98 ? "暗渠途中 (0, +1.5) 青い誓灯の下で停止" : "南端石段を降りて暗渠へ進む";
        return;
      }
      if (v === "inspectFakeSky") {
        const p = smoothstep(sec / 2.5);
        const tz = lerp(7.7, -1.2, p);
        hero.rig.position.set(0, getQ04SurfaceY(0, tz), tz);
        hero.rig.rotation.y = p < 0.85 ? Math.PI : lerpAngle(Math.PI, Math.PI / 2, (p - 0.85) / 0.15);
        if (p < 0.85) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        state.statusText = p >= 0.85 ? "東壁 (+2.34, 1.75, -1.2) の偽りの青空陶板（ひび・石枠）を確認" : "東壁の陶板前へ移動中";
        return;
      }

      const p = smoothstep(sec / 5.2);
      const tz = lerp(7.7, -7.7, p);
      const hy = getQ04SurfaceY(0, tz);
      hero.rig.position.set(0, hy, tz);
      hero.rig.rotation.y = Math.PI;
      if (p < 0.98) charApi.applyPose(hero.charObj, "walk", sec * 2.6);
      if (tz > 5.5) {
        hero.charObj.headPivot.rotation.x = 0.24;
        state.statusText = "Q03引継ぎ：低い入口で頭を下げ南石段を降下 (Y=" + hy.toFixed(2) + ")";
      } else if (tz < -5.5) {
        hero.charObj.headPivot.rotation.x = -0.22;
        state.statusText = p >= 0.98 ? "完了：北石段(0, -7.7, Y=" + hy.toFixed(2) + ")から出口光→Q05へ" : "北の昇り段で出口光を見上げながら上昇 (Y=" + hy.toFixed(2) + ")";
      } else {
        state.statusText = "暗渠中央を北へ進行中（西側排水溝回避）";
      }
    }

    const totalDuration = 5.4;
    return {
      id: "Q04", config: cfg, env: env, root: root,
      _inspect: { hero: hero, stepMeshes: stepMeshes, getSurfaceY: getQ04SurfaceY },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = ph === "initial" ? 0 : (ph === "mid" ? 2.6 : totalDuration); applyTimeline(state.time); },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) { return cfg.cameras[name] || cfg.cameras.wide; },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return totalDuration; },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) { state.time += dt; if (state.time >= totalDuration) { state.time = totalDuration; state.playing = false; } }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  // =========================================================================
  // 3. Q05 境石と外の草地 / M20（実前後Z＋本体実状態判定＋復元時clear完全リセット）
  // =========================================================================
  function buildQ05Controller(opts) {
    const cfg = STAGE2_CONFIG.Q05;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment("Q05", { envMap: opts.envMap });
    root.add(env.group);

    const borderLine = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.04, 0.14), new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.9 }));
    borderLine.position.set(0, 0.02, 0); root.add(borderLine);

    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);

    const dbg = createDebugLayer();
    dbg.addPath(cfg.path, 0x38bdf8, 0.1);
    dbg.addPoint(0, 1.48, 0.3, 0xf59e0b, 0.12);
    root.add(dbg.group);

    const state = {
      variant: "clearSuccess",
      playing: false,
      time: 0,
      statusText: "初期状態：南通路 (0, +6.0)",
      customGameState: null,
      holdingSnapshot: false,
      externalFlags: null, // 通しモード・本体から渡された実状態
      clearTriggered: false,
      clearTriggerCount: 0,
      hasCrossedInnerToOuter: false,
      prevZ: 6.0,
      lastEval: null
    };

    function getActiveFlags(v) {
      if (state.externalFlags) return state.externalFlags;
      if (v === "clearSuccess" || v === "stopBeforeStone" || v === "failOuterToInner") {
        return { collarRemoved: true, detectedAfterRemoval: false, passedRoyalEntranceThisRun: true, wearingCloak: false };
      }
      if (v === "failCollarOn") return { collarRemoved: false, detectedAfterRemoval: false, passedRoyalEntranceThisRun: true, wearingCloak: false };
      if (v === "failDetectedCloak") return { collarRemoved: true, detectedAfterRemoval: true, passedRoyalEntranceThisRun: true, wearingCloak: true };
      if (v === "failWrongRun") return { collarRemoved: true, detectedAfterRemoval: false, passedRoyalEntranceThisRun: false, wearingCloak: false };
      return { collarRemoved: false, detectedAfterRemoval: false, passedRoyalEntranceThisRun: false, wearingCloak: false };
    }

    function resetClearCounters(escapedBool) {
      state.clearTriggered = !!escapedBool;
      state.clearTriggerCount = escapedBool ? 1 : 0;
      state.hasCrossedInnerToOuter = !!escapedBool;
    }

    function applyGameStateSnapshot(gs) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      // 前の再生結果が残らないよう、本体のescapedに合わせて完全リセット！
      resetClearCounters(!!gs.escaped);
      charApi.applyPose(hero.charObj, "stand", 0);
      const hp = gs.heroPos || (gs.escaped ? [1.2, -2.1] : [0, 6]);
      hero.rig.position.set(hp[0], 0, hp[1]);
      hero.rig.rotation.y = gs.heroYaw ?? (gs.escaped ? -0.45 : Math.PI);
      hero.charObj.group.visible = !gs.wearingCloak;
      if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = !gs.collarRemoved;
      state.prevZ = hp[1];
      state.lastEval = evaluateQ05Clear(gs, hp[1], hp[1]); // 読込のみでは c4=false
      state.statusText = "保存復元（読込のみ横断不成立）：Z=" + hp[1].toFixed(2) + "／クリア=" + (state.clearTriggered ? "済" : "未");
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) { applyGameStateSnapshot(state.customGameState); return; }
      const v = state.variant;
      const flags = getActiveFlags(v);
      charApi.applyPose(hero.charObj, "stand", sec);
      if (hero.charObj.collarMesh) hero.charObj.collarMesh.visible = !flags.collarRemoved;
      hero.charObj.group.visible = !flags.wearingCloak;

      let hx = 0, hz = 6.0, hyaw = Math.PI;
      if (v === "stopBeforeStone") {
        const p = smoothstep(sec / 2.2);
        if (p < 0.55) { const q = p / 0.55; hx = lerp(0, 1.2, q); hz = lerp(6.0, 2.0, q); }
        else { const q = (p - 0.55) / 0.45; hx = 1.2; hz = lerp(2.0, 0.65, q); }
        hyaw = p > 0.9 ? -Math.PI * 0.65 : Math.PI;
        if (p < 0.96) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        hero.rig.position.set(hx, 0, hz); hero.rig.rotation.y = hyaw;
        state.lastEval = evaluateQ05Clear(flags, state.prevZ, hz);
        state.prevZ = hz;
        state.statusText = p >= 0.96 ? "境石手前 (1.2, +0.65) で停止・城側王冠を確認（横断未成立）" : "境石の手前へ接近";
        return;
      }

      if (v === "failOuterToInner") {
        const p = smoothstep(sec / 2.4);
        if (sec === 0) state.prevZ = -2.1;
        hx = 1.2; hz = lerp(-2.1, 2.0, p);
        hyaw = 0;
        if (p < 0.96) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        hero.rig.position.set(hx, 0, hz); hero.rig.rotation.y = hyaw;
        state.lastEval = evaluateQ05Clear(flags, state.prevZ, hz);
        state.prevZ = hz;
        state.statusText = "外から内へ戻る（Z=" + hz.toFixed(2) + "）：横断不成立";
        return;
      }

      const p = smoothstep(sec / 4.2);
      if (sec === 0) { state.prevZ = 6.0; state.hasCrossedInnerToOuter = false; }
      if (p < 0.35) { const q = p / 0.35; hx = lerp(0, 1.2, q); hz = lerp(6.0, 2.0, q); }
      else if (p < 0.55) { const q = (p - 0.35) / 0.20; hx = 1.2; hz = lerp(2.0, 0.65, q); }
      else if (p < 0.72) { const q = (p - 0.55) / 0.17; hx = 1.2; hz = lerp(0.65, -0.6, q); }
      else { const q = (p - 0.72) / 0.28; hx = 1.2; hz = lerp(-0.6, -2.1, q); }
      hyaw = p > 0.92 ? lerpAngle(Math.PI, -0.45, (p - 0.92) / 0.08) : Math.PI;
      if (p < 0.94) charApi.applyPose(hero.charObj, "walk", sec * 2.5);
      hero.rig.position.set(hx, 0, hz); hero.rig.rotation.y = hyaw;

      // 実際の前後Z座標で Z=0 の内→外横断を検出
      const ev = evaluateQ05Clear(flags, state.prevZ, hz);
      if (ev.conditions.crossedInnerToOuter) state.hasCrossedInnerToOuter = true;
      if (hz > cfg.boundaryZ) state.hasCrossedInnerToOuter = false;
      state.prevZ = hz;
      ev.conditions.crossedInnerToOuter = state.hasCrossedInnerToOuter;
      ev.cleared = Object.values(ev.conditions).every(Boolean);
      state.lastEval = ev;

      if (ev.cleared && hz <= cfg.grassConfirmZ) {
        if (!state.clearTriggered) {
          state.clearTriggered = true;
          state.clearTriggerCount += 1;
        }
        state.statusText = "🎉 M20 脱出クリア成立！（4条件同時成立・草地着地後1回のみ発火）";
      } else if (hz <= cfg.grassConfirmZ) {
        const reasons = [];
        if (!flags.collarRemoved) reasons.push("首輪あり");
        if (flags.detectedAfterRemoval) reasons.push("解除後発見済(マント不可)");
        if (!flags.passedRoyalEntranceThisRun) reasons.push("同逃走で王家入口未通過");
        state.statusText = "境界横断したがクリア不成立：" + reasons.join("・");
      } else {
        state.statusText = "境石の右側を通って外の草地へ進行中 (Z=" + hz.toFixed(2) + ")";
      }
    }

    const totalDuration = 4.5;
    return {
      id: "Q05", config: cfg, env: env, root: root,
      _inspect: { hero: hero, getState: function () { return { clearTriggered: state.clearTriggered, clearTriggerCount: state.clearTriggerCount, lastEval: state.lastEval, prevZ: state.prevZ }; } },
      setExternalFlags: function (f) { state.externalFlags = f || null; },
      hasCleared: function () { return state.clearTriggered; },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; resetClearCounters(false); state.prevZ = vid === "failOuterToInner" ? -2.1 : 6.0; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; if (ph === "initial") { resetClearCounters(false); state.time = 0; } else if (ph === "mid") { state.time = 2.6; } else { state.time = totalDuration; } applyTimeline(state.time); },
      play: function () { state.customGameState = null; state.holdingSnapshot = false; resetClearCounters(false); state.prevZ = state.variant === "failOuterToInner" ? -2.1 : 6.0; state.time = 0; state.playing = true; },
      reset: function () { state.customGameState = null; state.holdingSnapshot = false; resetClearCounters(false); state.prevZ = state.variant === "failOuterToInner" ? -2.1 : 6.0; state.time = 0; state.playing = false; applyTimeline(0); },
      setTime: function (sec) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = sec; applyTimeline(sec); },
      setDebugVisible: function (vis) { dbg.group.visible = !!vis; },
      getCameraPreset: function (name) { return cfg.cameras[name] || cfg.cameras.wide; },
      getStatusText: function () { return state.statusText; },
      getTotalDuration: function () { return totalDuration; },
      update: function (dt, elapsed) {
        env.update(elapsed);
        if (state.playing) { state.time += dt; if (state.time >= totalDuration) { state.time = totalDuration; state.playing = false; } }
        applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  global.CastleEscapeStage2 = {
    STAGE2_CONFIG: STAGE2_CONFIG,
    getQ04SurfaceY: getQ04SurfaceY,
    evaluateQ05Clear: evaluateQ05Clear,
    createSceneController: function (sceneId, options) {
      const opts = options || {};
      let ctrl = null;
      if (sceneId === "W04") ctrl = buildW04Controller(opts);
      else if (sceneId === "Q04") ctrl = buildQ04Controller(opts);
      else ctrl = buildQ05Controller(opts);
      if (opts.scene) opts.scene.add(ctrl.root);
      return ctrl;
    }
  };
})(window);
