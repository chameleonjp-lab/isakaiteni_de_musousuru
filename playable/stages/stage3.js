/**
 * 王都からの脱出 — 第3段階：重要品13点(I01〜I13)＆関連人物演出(C01/E07/S04) 3Dモジュール v2
 * 依存: Three.js r128, CastleEscapeModels, CastleEscapeItems, CastleEscapeEnvironments
 *
 * v2 修正点:
 *   - 人物ID全照合修正: E01洗濯係ミナ=P11、E03鳩番オト=P13（旧P13/P15の誤配を解消）。
 *   - S04: 背景の固定格子12本を非表示化し、開閉する内格子一組のみへ統一（奥の外扉・閂は常時閉鎖）。
 *   - 道具4状態管理（hidden:しまわれている / revealed:開いたが未取得 / held:手に取った / acquired:取得済み）＆完全applyGameState（heroPos, heroYaw, itemState, boxOpen, grateOpen復元、未開封品は確実に非表示）。
 *   - 実モデルの動きと説明文を完全一致: E02マント肩装着、W03肖像額10度傾きピボット、G01上下可動くちばし開閉、S03ドル槍受け預け、C01国王座り姿勢（大腿前傾・膝曲げ）。
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

  // 国王P01用の明確な座り姿勢（applyPoseにsit未定義のため脚を大腿前傾・膝曲げへ直接適用）
  function applyKingSeatedPose(charObj, sec) {
    getCharApi().applyPose(charObj, "stand", sec);
    charObj.leftLeg.hip.rotation.x = -Math.PI * 0.46;
    charObj.leftLeg.knee.rotation.x = Math.PI * 0.46;
    charObj.rightLeg.hip.rotation.x = -Math.PI * 0.46;
    charObj.rightLeg.knee.rotation.x = Math.PI * 0.46;
    charObj.upperBody.rotation.x = 0.04;
  }

  const STAGE3_CONFIG = {
    C01: {
      missionId: "M01-M02", itemId: "PROP_THRONE", title: "C01 玉座の間（謁見・片膝傅き）",
      heroPos: [0, 0, 1.2], kingPos: [0, 1.56, -6.86], rizePos: [1.9, 0.78, -5.6], luoPos: [-1.35, 0, 1.0],
      guards: [[-2.8, 0, -0.9], [2.8, 0, -0.9]],
      cameras: { wide: { pos: [4.8, 3.8, 5.2], look: [0, 1.3, -2.8] }, closeup: { pos: [1.8, 1.8, 3.2], look: [0, 1.1, 0.8] } },
      variants: [
        { id: "call1Bow", label: "1回目の呼びかけ：伏せて待つ" },
        { id: "call2Raise", label: "2回目：頭を上げる（リゼ首輪を見て表情落）" },
        { id: "earlyRaiseWarn", label: "誤って先に顔上げ：衛兵槍石突き床当て" }
      ]
    },
    W01: {
      missionId: "M03", itemId: "I01", title: "W01 西資料室／I01 綴じ穴のある備品図",
      itemPos: [0, 1.12, -4.53], heroPos: [0, 0, -3.55], npcPos: [-1.25, 0, -4.0], npcId: "P07",
      cameras: { wide: { pos: [3.2, 2.8, -1.2], look: [0, 1.15, -4.4] }, closeup: { pos: [0.85, 1.48, -3.15], look: [0, 1.15, -4.55] } },
      variants: [{ id: "acquire", label: "M03 司書ネリ(P07)指差し→I01引き出し" }]
    },
    E01: {
      missionId: "M04", itemId: "I02", title: "E01 洗濯仕分け場／I02 燕尾の布札",
      itemPos: [0.8, 1.30, 1.92], heroPos: [0.8, 0, 2.85], npcPos: [-0.35, 0, 2.55], npcId: "P11", // 洗濯係ミナ P11
      cameras: { wide: { pos: [3.4, 2.5, 4.6], look: [0.5, 1.2, 1.9] }, closeup: { pos: [1.55, 1.5, 3.15], look: [0.8, 1.28, 1.92] } },
      variants: [{ id: "acquire", label: "M04 洗濯係ミナ(P11)籠接地→布よけ→I02二股開放" }]
    },
    N01: {
      missionId: "M05", itemId: "I03", title: "N01 窯見本室／I03 三溝の釉板",
      itemPos: [-3.0, 0.95, 2.0], heroPos: [-3.0, 0, 3.05], npcPos: [-4.4, 0, 2.0], npc2Pos: [-1.6, 0, 2.0], npcId: "P17", npc2Id: "P18",
      cameras: { wide: { pos: [-0.4, 2.8, 4.8], look: [-3.0, 1.0, 2.0] }, closeup: { pos: [-2.1, 1.48, 3.15], look: [-3.0, 0.98, 2.0] } },
      variants: [{ id: "acquire", label: "M05 陶工イオ(P17)器接地→I01照合→I03反転し裏三溝" }]
    },
    S01: {
      missionId: "M06", itemId: "I04", title: "S01 南返納庫／I04 中空の調律棒",
      itemPos: [2.0, 0.56, -1.6], boxPos: [2.0, 0.39, -1.6], heroPos: [2.0, 0, -0.45],
      cameras: { wide: { pos: [3.6, 2.5, 1.8], look: [1.5, 0.7, -1.5] }, closeup: { pos: [2.75, 1.35, -0.35], look: [2.0, 0.52, -1.6] } },
      variants: [
        { id: "bothSlots", label: "M06 左I02＋右I03→底板+0.14上昇＆I04出現" },
        { id: "singleSlotFail", label: "失敗見本：片側挿し（底板傾き＆札戻り・報酬なし）" }
      ]
    },
    N02: {
      missionId: "M07", itemId: "I05", title: "N02 施療院／I05 透明な救護札",
      itemPos: [4.35, 1.16, -0.55], heroPos: [3.2, 0, -0.55], npcPos: [3.6, 0, 0.45], npcId: "P19",
      cameras: { wide: { pos: [1.2, 2.5, 2.2], look: [3.8, 1.1, -0.3] }, closeup: { pos: [2.75, 1.45, 0.35], look: [4.1, 1.18, -0.45] } },
      variants: [{ id: "acquire", label: "M07 療術師セト(P19)医務印照合→透き窓左脚印提示" }]
    },
    G01: {
      missionId: "M08", itemId: "I06", title: "G01 雨量庭園／I06 首輪の白鍵",
      heronPos: [0, 0.88, 0], dishPos: [0, 0.65, 0.95], heroPos: [0.85, 0, 0.85],
      cameras: { wide: { pos: [3.2, 2.6, 3.6], look: [0, 1.1, 0.2] }, closeup: { pos: [1.35, 1.42, 1.85], look: [0.08, 1.15, 0.35] } },
      variants: [
        { id: "rodAndPass", label: "M08 左脚I05+I04→水滴→上下くちばし開→白鍵落下" },
        { id: "rodOnlyFail", label: "失敗見本：調律棒I04のみ（くちばし開かず落下なし）" }
      ]
    },
    E02: {
      missionId: "M09", itemId: "I07", title: "E02 東廊下／I07 隠密のマント",
      itemPos: [-2.4, 0.45, 0], heroPos: [-1.25, 0, 0],
      cameras: { wide: { pos: [1.8, 2.5, 2.8], look: [-1.8, 0.9, 0] }, closeup: { pos: [-0.45, 1.38, 1.35], look: [-1.85, 1.05, 0] } },
      variants: [{ id: "acquire", label: "M09 I02解除→星箱蓋75°開→星裏地確認＆主人公肩へ装着" }]
    },
    W02: {
      missionId: "M10", itemId: "I08", title: "W02 織物回廊／I08 王家の透かし帯",
      itemPos: [-2.8, 1.20, -4.75], path: [[-2.8, 5.1], [-2.8, 3.6], [-2.8, -4.7]],
      cameras: { wide: { pos: [-0.2, 3.6, 4.8], look: [-2.5, 1.2, -1.5] }, closeup: { pos: [-1.85, 1.5, -3.2], look: [-2.8, 1.22, -4.75] } },
      variants: [{ id: "acquire", label: "M10 裏見台通過（裾10模様順に消灯）→逆光窓でI08取得" }]
    },
    S02: {
      missionId: "M11", itemId: "I09", title: "S02 冬客間／I09 伏せ舟の影板",
      itemPos: [-2.2, 0.94, -1.16], heroPos: [-2.2, 0, -0.35],
      cameras: { wide: { pos: [0.8, 2.3, 2.4], look: [-2.1, 1.0, -1.2] }, closeup: { pos: [-1.35, 1.28, 0.55], look: [-2.2, 0.95, -1.16] } },
      variants: [{ id: "acquire", label: "M11 しゃがみ＋I01綴じ穴合わせ→I09手前0.10m抜去" }]
    },
    N03: {
      missionId: "M12", itemId: "I10", title: "N03 星暦室／I10 王女の星暦頁",
      astroPos: [0, 1.12, 0], windowPos: [0, 1.45, 0.65], heroPos: [0, 0, 1.65],
      cameras: { wide: { pos: [3.2, 2.8, 3.6], look: [0, 1.35, 0] }, closeup: { pos: [0.95, 1.65, 2.25], look: [0, 1.45, 0.45] } },
      variants: [
        { id: "bothPlaced", label: "M12 I08先掛け＋I09伏せ舟下溝→輪停止＆右下I10外れ" },
        { id: "oneOnlyFail", label: "失敗見本：I08片方のみ（留め金閉鎖・頁外れず）" }
      ]
    },
    E03: {
      missionId: "M13", itemId: "I11", title: "E03 王家の鳩舎／I11 覗き錘（真鍮の卵）",
      itemPos: [1.25, 1.20, -1.55], heroPos: [1.25, 0, -0.55], npcPos: [0.1, 0, -0.9], npcId: "P13", // 鳩番オト P13
      cameras: { wide: { pos: [3.6, 2.6, 2.2], look: [0.8, 1.25, -1.4] }, closeup: { pos: [2.0, 1.5, 0.35], look: [1.1, 1.22, -1.5] } },
      variants: [{ id: "acquire", label: "M13 鳩番オト(P13)肩鳩追従＆筒指示→I10通し→I11転がり" }]
    },
    W03: {
      missionId: "M14", itemId: "I12", title: "W03 肖像修復室／I12 王女の私筆の控え",
      portraitPos: [0, 1.78, -2.1], deskPos: [2.8, 0.95, 1.4], heroPos: [0, 0, -0.9], npcPos: [-1.45, 0, -1.35], npcId: "P09",
      cameras: { wide: { pos: [3.8, 2.8, 3.6], look: [0.8, 1.35, -0.8] }, closeup: { pos: [1.15, 1.85, -0.25], look: [0, 1.75, -2.05] } },
      variants: [{ id: "acquire", label: "M14 絵師マレ(P09)→肖像額10°傾け→東机で手帳I12記入" }]
    },
    S03: {
      missionId: "M15", itemId: "I13", title: "S03 鐘番室／I13 巡回環",
      boardPos: [0, 2.0, -4.37], itemPos: [0, 1.35, -4.25], spearRackPos: [1.6, 0, -4.05], heroPos: [0, 0, -3.15], npcPos: [0.95, 0, -3.45], npcId: "P23",
      cameras: { wide: { pos: [2.8, 2.6, -0.6], look: [0.3, 1.5, -4.1] }, closeup: { pos: [0.85, 1.65, -2.55], look: [0.1, 1.5, -4.25] } },
      variants: [{ id: "acquire", label: "M15 鐘番ドル(P23)槍受けへ槍預け→指針＆2切れ目指差し→I13" }]
    },
    E07: {
      missionId: "E07", itemId: "I02", title: "E07 東詰所（東番キリP16・受け渡し窓）",
      windowPos: [2.0, 1.10, 0.74], heroPos: [2.0, 0, 1.45], npcPos: [2.0, 0, -0.15], npcId: "P16",
      cameras: { wide: { pos: [4.2, 2.4, 3.4], look: [2.0, 1.15, 0.6] }, closeup: { pos: [3.15, 1.48, 2.05], look: [2.0, 1.15, 0.74] } },
      variants: [{ id: "handoff", label: "E07 東番キリ(P16)立入線外の主人公へ窓から手を伸ばす" }]
    },
    S04: {
      missionId: "E152", itemId: "PROP_GATE", title: "S04 南門検札所（門番ウルP24・二叩き一礼＆単一内格子）",
      heroPos: [0, 0, 0.85], npcPos: [1.45, 0, -3.2], npcId: "P24", grateZ: -5.5,
      cameras: { wide: { pos: [4.2, 3.2, 4.2], look: [0, 1.5, -2.2] }, closeup: { pos: [1.6, 1.55, 2.65], look: [0, 1.25, 0.35] } },
      variants: [
        { id: "saluteOpenGrate", label: "E152 右胸0.3s間隔2叩き→25°一礼→単一内格子開放（外扉・閂閉）" },
        { id: "noSaluteClosed", label: "礼法なし：内格子も外扉も閉鎖維持" }
      ]
    }
  };

  const SCENE_ORDER = ["C01","W01","E01","N01","S01","N02","G01","E02","W02","S02","N03","E03","W03","S03","E07","S04"];

  function buildStage3Scene(sceneId, opts) {
    const cfg = STAGE3_CONFIG[sceneId] || STAGE3_CONFIG.W01;
    const charApi = getCharApi();
    const root = new THREE.Group();
    const env = global.CastleEscapeEnvironments.createEnvironment(sceneId, { envMap: opts.envMap });
    root.add(env.group);

    const dbg = createDebugLayer();
    const actors = {};
    const props = {};
    const state = {
      variant: cfg.variants[0].id,
      playing: false,
      time: 0,
      statusText: "初期状態",
      customGameState: null,
      holdingSnapshot: false,
      itemState: "hidden", // "hidden" | "revealed" | "held" | "acquired"
      acquireNotified: false
    };

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a22, roughness: 0.74 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.42, metalness: 0.84 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b848, roughness: 0.24, metalness: 0.88 });

    const hero = createActorRig("P00", { envMap: opts.envMap });
    if (hero.charObj.mainProp) hero.charObj.mainProp.visible = false;
    root.add(hero.rig);
    actors.hero = hero;

    // 場面別セットアップ
    if (sceneId === "C01") {
      actors.king = createActorRig("P01", { envMap: opts.envMap });
      actors.rize = createActorRig("P02", { envMap: opts.envMap });
      actors.luo = createActorRig("P03", { envMap: opts.envMap });
      actors.guardL = createActorRig("P16", { envMap: opts.envMap });
      actors.guardR = createActorRig("P24", { envMap: opts.envMap });
      [actors.king, actors.rize, actors.luo, actors.guardL, actors.guardR].forEach(function (a) { root.add(a.rig); });
    } else if (sceneId === "S01") {
      props.i02 = global.CastleEscapeItems.createItemOrProp("I02", { envMap: opts.envMap }); props.i02.group.scale.setScalar(0.32); root.add(props.i02.group);
      props.i03 = global.CastleEscapeItems.createItemOrProp("I03", { envMap: opts.envMap }); props.i03.group.scale.setScalar(0.32); root.add(props.i03.group);
      props.i04 = global.CastleEscapeItems.createItemOrProp("I04", { envMap: opts.envMap }); props.i04.group.scale.setScalar(0.42); props.i04.group.visible = false; root.add(props.i04.group);
      props.tray = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, 0.72), ironMat);
      props.tray.position.set(cfg.boxPos[0], cfg.boxPos[1] + 0.32, cfg.boxPos[2]); root.add(props.tray);
    } else if (sceneId === "G01") {
      env.group.traverse(function (ch) {
        if (ch.isMesh && Math.hypot(ch.position.x, ch.position.z) < 0.7 && ch.position.y > 0.5) ch.visible = false;
      });
      props.heron = global.CastleEscapeItems.createItemOrProp("PROP_HERON", { envMap: opts.envMap });
      props.heron.group.position.set(cfg.heronPos[0], cfg.heronPos[1], cfg.heronPos[2]);
      // 固定くちばし＆固定鍵光を非表示化し、上下2部品の可動くちばしへ差し替え！
      props.heron.group.traverse(function (ch) {
        if (ch.isMesh && ch.position.z > 0.4) ch.visible = false;
      });
      props.upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.36, 8), goldMat);
      props.upperBeak.rotation.x = Math.PI / 2 + 0.14;
      props.upperBeak.position.set(0, 1.06, 0.52);
      props.heron.group.add(props.upperBeak);
      props.lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.34, 8), goldMat);
      props.lowerBeak.rotation.x = Math.PI / 2 + 0.22;
      props.lowerBeak.position.set(0, 1.02, 0.51);
      props.heron.group.add(props.lowerBeak);
      root.add(props.heron.group);

      props.dish = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.08, 16), goldMat);
      props.dish.position.set(cfg.dishPos[0], cfg.dishPos[1], cfg.dishPos[2]); root.add(props.dish);
      props.i04 = global.CastleEscapeItems.createItemOrProp("I04", { envMap: opts.envMap }); props.i04.group.scale.setScalar(0.35); root.add(props.i04.group);
      props.i05 = global.CastleEscapeItems.createItemOrProp("I05", { envMap: opts.envMap }); props.i05.group.scale.setScalar(0.32); root.add(props.i05.group);
      props.i06 = global.CastleEscapeItems.createItemOrProp("I06", { envMap: opts.envMap }); props.i06.group.scale.setScalar(0.24); props.i06.group.visible = false; root.add(props.i06.group);
      props.drop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 })); props.drop.visible = false; root.add(props.drop);
    } else if (sceneId === "N03") {
      env.group.traverse(function (ch) {
        if (ch.isMesh && Math.hypot(ch.position.x, ch.position.z) < 1.6 && ch.position.y > 0.3) ch.visible = false;
      });
      props.astro = global.CastleEscapeItems.createItemOrProp("PROP_ASTRO", { envMap: opts.envMap });
      props.astro.group.position.set(cfg.astroPos[0], cfg.astroPos[1], cfg.astroPos[2]);
      props.astro.group.scale.setScalar(1.35); root.add(props.astro.group);
      props.astro.group.userData.walkObstacle = true;
      props.i08 = global.CastleEscapeItems.createItemOrProp("I08", { envMap: opts.envMap }); props.i08.group.scale.setScalar(0.42); root.add(props.i08.group);
      props.i09 = global.CastleEscapeItems.createItemOrProp("I09", { envMap: opts.envMap }); props.i09.group.scale.setScalar(0.36); root.add(props.i09.group);
      props.i10 = global.CastleEscapeItems.createItemOrProp("I10", { envMap: opts.envMap }); props.i10.group.scale.setScalar(0.36); props.i10.group.visible = false; root.add(props.i10.group);
    } else if (sceneId === "E02") {
      props.lid = new THREE.Group();
      props.lid.position.set(-3.15, .92, 0);
      const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, .10, .95), woodMat);
      lidMesh.position.x = .75; props.lid.add(lidMesh);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(.2), goldMat);
      star.position.set(.75, .085, 0);
      star.scale.y = .22;
      props.lid.add(star);
      root.add(props.lid);
      // 箱内用マント（未開封時は非表示）＋主人公肩装着マント（完了時に肩へ装着表示！）
      props.item = global.CastleEscapeItems.createItemOrProp("I07", { envMap: opts.envMap });
      props.item.group.scale.setScalar(0.48); props.item.group.visible = false; root.add(props.item.group);
      props.wornCloak = global.CastleEscapeItems.createItemOrProp("I07", { envMap: opts.envMap });
      props.wornCloak.group.scale.setScalar(0.84);
      props.wornCloak.group.position.set(0, 0.22, -0.02);
      props.wornCloak.group.visible = false;
      hero.charObj.upperBody.add(props.wornCloak.group);
    } else if (sceneId === "W02") {
      props.item = global.CastleEscapeItems.createItemOrProp("I08", { envMap: opts.envMap }); props.item.group.scale.setScalar(0.45); root.add(props.item.group);
      props.hemStars = [];
      for (let i = 0; i < 10; i++) {
        const st = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe59e }));
        st.position.set(-2.8 + (i - 4.5) * 0.12, 0.35, 3.2); root.add(st); props.hemStars.push(st);
      }
      dbg.addPath(cfg.path, 0x38bdf8, 0.08);
    } else if (sceneId === "S04") {
      actors.npc = createActorRig("P24", { envMap: opts.envMap }); root.add(actors.npc.rig);
      // 背景の固定格子12本（Z=-5.5付近 CylinderGeometry）を完全非表示にして単一内格子へ統一！
      env.group.traverse(function (ch) {
        if (ch.isMesh && ch.geometry && ch.geometry.type === "CylinderGeometry" && Math.abs(ch.position.z - (-5.5)) < 0.2) {
          ch.visible = false;
        }
      });
      props.innerGrate = new THREE.Group();
      props.innerGrate.position.set(0, 0, cfg.grateZ);
      for (let gx = -3.0; gx <= 3.0; gx += 0.6) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), ironMat);
        b.position.set(gx, 2.1, 0); props.innerGrate.add(b);
      }
      root.add(props.innerGrate);
      props.innerGrate.userData.walkObstacle = true;
      const outerDoor = new THREE.Mesh(new THREE.BoxGeometry(5.8, 4.4, 0.25), woodMat);
      outerDoor.position.set(0, 2.2, -6.25); root.add(outerDoor);
      outerDoor.userData.walkObstacle = true;
      const barLock = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 0.34), ironMat);
      barLock.position.set(0, 1.85, -6.08); root.add(barLock);
    } else {
      if (cfg.npcId) { actors.npc = createActorRig(cfg.npcId, { envMap: opts.envMap }); root.add(actors.npc.rig); }
      if (cfg.npc2Id) { actors.npc2 = createActorRig(cfg.npc2Id, { envMap: opts.envMap }); root.add(actors.npc2.rig); }
      if (cfg.itemId && cfg.itemId.startsWith("I")) {
        props.item = global.CastleEscapeItems.createItemOrProp(cfg.itemId, { envMap: opts.envMap });
        props.item.group.scale.setScalar(0.38); root.add(props.item.group);
      }
      if (sceneId === "W03") {
        // 既存静止肖像額を非表示化し、約10度傾くピボット額＋目高さ文字プレートを設置！
        env.group.traverse(function (ch) {
          if (ch.isMesh && Math.abs(ch.position.x) < 0.2 && Math.abs(ch.position.z - (-2.1)) < 0.25 && ch.position.y > 1.2) ch.visible = false;
        });
        props.portraitPivot = new THREE.Group();
        props.portraitPivot.position.set(cfg.portraitPos[0], cfg.portraitPos[1], cfg.portraitPos[2]);
        props.portraitPivot.add(new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.35, 0.14), goldMat));
        const pCanv = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 2.05), new THREE.MeshStandardMaterial({ color: 0x5c3e4c, roughness: 0.78 }));
        pCanv.position.z = 0.08; props.portraitPivot.add(pCanv);
        props.secretTextGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.22), new THREE.MeshBasicMaterial({ color: 0xffe8a3, transparent: true, opacity: 0.0 }));
        props.secretTextGlow.position.set(0, 0.35, 0.09); props.portraitPivot.add(props.secretTextGlow);
        root.add(props.portraitPivot);
        props.portraitPivot.userData.walkObstacle = true;
      }
      if (sceneId === "E03") {
        // 鳩番オト(P13)の肩に追従する鳩
        props.dove = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.7 }));
        props.dove.position.set(0.18, 0.62, 0.02);
        actors.npc.charObj.upperBody.add(props.dove);
      }
      if (sceneId === "S03") {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), woodMat);
        rack.position.set(cfg.spearRackPos[0], 0.6, cfg.spearRackPos[2]); root.add(rack);
        rack.userData.walkObstacle = true;
        // ドルが預ける槍（手持ち→槍受けへ移動）
        props.rackSpear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 2.35, 8), woodMat);
        props.rackSpear.position.set(cfg.spearRackPos[0], 1.18, cfg.spearRackPos[2]);
        props.rackSpear.visible = false; root.add(props.rackSpear);
      }
    }
    for (const [name, actor] of Object.entries(actors)) {
      if (name !== "hero") actor.rig.userData.walkObstacle = "actor";
    }
    root.add(dbg.group);

    // 4状態 (hidden / revealed / held / acquired) ＋ heroPos / heroYaw / 装置状態の完全復元！
    function applyGameStateSnapshot(gs, elapsed = 0) {
      state.customGameState = gs;
      state.holdingSnapshot = true;
      state.playing = false;
      charApi.applyPose(hero.charObj, "stand", 0);
      if (gs.heroPos) hero.rig.position.set(gs.heroPos[0], 0, gs.heroPos[1]);
      else if (cfg.heroPos) hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]);
      if (gs.heroYaw !== undefined) hero.rig.rotation.y = gs.heroYaw;

      const ist = gs.itemState || (gs.acquired ? "acquired" : "hidden");
      state.itemState = ist;

      // Tools brought to the puzzle appear only during its demonstration.
      for (const part of ["i02","i03","i04","i05","i08","i09","drop"]) {
        if (props[part]) (props[part].group ?? props[part]).visible = false;
      }
      const showAtOrigin = ist === "revealed";
      if (sceneId === "S01") {
        props.tray.position.y = cfg.boxPos[1] + .32 + (showAtOrigin || ist === "acquired" ? .14 : 0);
        props.tray.rotation.z = 0;
        props.i04.group.position.set(cfg.boxPos[0], props.tray.position.y + .12, cfg.boxPos[2]);
        props.i04.group.visible = showAtOrigin;
      } else if (sceneId === "G01") {
        props.upperBeak.rotation.x = Math.PI / 2 + .14;
        props.lowerBeak.rotation.x = Math.PI / 2 + .22;
        props.i06.group.position.set(cfg.dishPos[0], cfg.dishPos[1] + .08, cfg.dishPos[2]);
        props.i06.group.visible = showAtOrigin;
      } else if (sceneId === "N03") {
        props.astro.update(gs.puzzleSolved ? 1.25 : elapsed);
        props.i10.group.position.set(.38, 1.18, .95);
        props.i10.group.visible = showAtOrigin;
      } else if (props.item) {
        const origin = cfg.itemPos ?? cfg.deskPos ?? cfg.windowPos;
        props.item.group.position.set(...origin);
        if (sceneId === "W03") {
          props.item.group.rotation.x = -Math.PI / 2;
          props.item.group.position.y += .04;
        }
        const outInRoom = ["W01","E01","N01","N02","S03"].includes(sceneId);
        props.item.group.visible = showAtOrigin || (outInRoom && ist === "hidden");
        if (sceneId === "E02") {
          props.lid.rotation.z = (gs.boxOpen || showAtOrigin || ist === "acquired") ? (75 * Math.PI / 180) : 0;
          props.wornCloak.group.visible = (ist === "acquired" || ist === "held");
        }
      }
      if (props.hemStars) props.hemStars.forEach((star, index) => {
        star.visible = ist !== "acquired";
        star.position.set(-2.8 + (index - 4.5) * .12, .35, 3.2);
      });
      if (actors.npc) charApi.applyPose(actors.npc.charObj, "idle", elapsed);
      if (actors.npc2) charApi.applyPose(actors.npc2.charObj, "idle", elapsed + .7);
      if (props.innerGrate) props.innerGrate.position.y = gs.grateOpen ? 2.6 : 0;
      if (props.portraitPivot) {
        props.portraitPivot.rotation.x = gs.puzzleSolved ? (-10 * Math.PI / 180) : 0;
        props.secretTextGlow.material.opacity = gs.puzzleSolved ? 1 : 0;
      }
      if (props.rackSpear) {
        props.rackSpear.visible = !!gs.puzzleSolved;
        if (actors.npc.charObj.mainProp) actors.npc.charObj.mainProp.visible = !gs.puzzleSolved;
      }
      if (sceneId === "C01") {
        hero.rig.rotation.y = gs.heroYaw ?? Math.PI;
        if (gs.audienceStep !== 2) {
          charApi.applyPose(hero.charObj, "kneel", 0);
          hero.charObj.headPivot.rotation.x = 0.55;
        }
        actors.luo.rig.visible = gs.audienceStep !== 2;
        applyKingSeatedPose(actors.king.charObj, elapsed);
        charApi.applyPose(actors.rize.charObj, "idle", elapsed);
      }
      state.statusText = "保存復元：" + sceneId + "／状態=" + ist;
    }

    function applyTimeline(sec) {
      if (state.holdingSnapshot && state.customGameState) { applyGameStateSnapshot(state.customGameState); return; }
      const v = state.variant;
      charApi.applyPose(hero.charObj, "stand", sec);
      if (actors.npc) charApi.applyPose(actors.npc.charObj, "stand", sec);
      if (actors.npc2) charApi.applyPose(actors.npc2.charObj, "stand", sec);

      if (sceneId === "C01") {
        actors.luo.rig.visible = true;
        actors.king.rig.position.set(cfg.kingPos[0], cfg.kingPos[1] - 0.85, cfg.kingPos[2]); actors.king.rig.rotation.y = 0;
        applyKingSeatedPose(actors.king.charObj, sec);
        actors.rize.rig.position.set(cfg.rizePos[0], cfg.rizePos[1], cfg.rizePos[2]); actors.rize.rig.rotation.y = -0.35;
        charApi.applyPose(actors.rize.charObj, "stand", sec);
        actors.luo.rig.position.set(cfg.luoPos[0], 0, cfg.luoPos[2]); actors.luo.rig.rotation.y = 0.6;
        charApi.applyPose(actors.luo.charObj, "stand", sec);
        actors.guardL.rig.position.set(cfg.guards[0][0], 0, cfg.guards[0][2]); actors.guardL.rig.rotation.y = Math.PI / 2;
        actors.guardR.rig.position.set(cfg.guards[1][0], 0, cfg.guards[1][2]); actors.guardR.rig.rotation.y = -Math.PI / 2;
        charApi.applyPose(actors.guardL.charObj, "stand", sec); charApi.applyPose(actors.guardR.charObj, "stand", sec);

        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = Math.PI;
        charApi.applyPose(hero.charObj, "kneel", sec);
        if (v === "call1Bow") {
          hero.charObj.headPivot.rotation.x = 0.55;
          actors.king.charObj.rightArm.shoulder.rotation.x = -0.75 * Math.sin(clamp01(sec / 1.8) * Math.PI);
          state.statusText = "C01 1回目：国王(座り姿勢)の呼びかけにP00は片膝で伏せて待つ";
        } else if (v === "call2Raise") {
          const p = smoothstep((sec - 0.6) / 0.9);
          hero.charObj.headPivot.rotation.x = lerp(0.55, -0.05, p);
          actors.rize.charObj.headPivot.rotation.x = 0.25 * p;
          state.statusText = "C01 2回目：頭を上げる→リゼが首輪を見て表情を落とす";
        } else {
          const p = smoothstep(sec / 0.6);
          hero.charObj.headPivot.rotation.x = lerp(0.55, -0.1, p);
          const tap = Math.sin(clamp01((sec - 0.8) / 0.5) * Math.PI);
          actors.guardR.charObj.rightArm.shoulder.rotation.x = -0.35 * tap;
          state.statusText = "C01 早上げ警告：右衛兵が槍の石突きを床に一度当てる";
        }
        return;
      }

      if (sceneId === "S01") {
        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = Math.PI;
        const p = smoothstep(sec / 2.2);
        if (v === "singleSlotFail") {
          state.itemState = "hidden";
          props.i02.group.visible = true;
          props.i02.group.position.set(1.75, 0.72, p < 0.6 ? lerp(-1.0, -1.52, p / 0.6) : lerp(-1.52, -1.0, (p - 0.6) / 0.4));
          props.i03.group.visible = false;
          props.tray.position.y = cfg.boxPos[1] + 0.32;
          props.tray.rotation.z = p > 0.4 && p < 0.7 ? 0.14 : 0;
          props.i04.group.visible = false;
          state.statusText = "S01 片側挿し失敗：底板傾き＆I02戻り（I04未出現）";
        } else {
          props.i02.group.visible = true; props.i03.group.visible = true;
          const slotZ = lerp(-1.0, -1.52, Math.min(1, p * 2));
          props.i02.group.position.set(1.75, 0.72, slotZ);
          props.i03.group.position.set(2.25, 0.72, slotZ);
          const rise = p > 0.5 ? smoothstep((p - 0.5) * 2) : 0;
          props.tray.rotation.z = 0;
          props.tray.position.y = cfg.boxPos[1] + 0.32 + rise * 0.14;
          state.itemState = p >= 0.96 ? "acquired" : (rise > 0.2 ? "revealed" : "hidden");
          props.i04.group.visible = (state.itemState === "revealed");
          props.i04.group.position.set(2.0, props.tray.position.y + 0.12, -1.6);
          state.statusText = p >= 0.96 ? "S01 完了：I04取得済（箱内は空）" : "S01 M06：左I02＋右I03一致→底板+0.14m上昇＆I04出現";
        }
        return;
      }

      if (sceneId === "G01") {
        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = -Math.PI * 0.75;
        const p = smoothstep(sec / 2.6);
        props.i04.group.visible = true;
        props.i04.group.position.set(0.28, 0.98, lerp(0.55, 0.25, Math.min(1, p * 2)));
        props.i05.group.visible = (v === "rodAndPass");
        props.i05.group.position.set(0.18, 0.92, 0.32);
        if (v === "rodOnlyFail") {
          state.itemState = "hidden";
          props.upperBeak.rotation.x = Math.PI / 2 + 0.14;
          props.lowerBeak.rotation.x = Math.PI / 2 + 0.22;
          props.drop.visible = false; props.i06.group.visible = false;
          state.statusText = "G01 失敗見本：調律棒I04のみ（くちばし閉鎖・白鍵落下なし）";
        } else {
          props.drop.visible = p > 0.32 && p < 0.62;
          props.drop.position.set(0.12, lerp(0.95, 0.45, (p - 0.32) / 0.3), 0.22);
          // 上下のくちばしが実際に開く！
          const beakOpen = p > 0.48 ? smoothstep((p - 0.48) / 0.18) * 0.28 : 0;
          props.upperBeak.rotation.x = Math.PI / 2 + 0.14 - beakOpen;
          props.lowerBeak.rotation.x = Math.PI / 2 + 0.22 + beakOpen;
          state.itemState = p >= 0.96 ? "acquired" : (p > 0.58 ? "revealed" : "hidden");
          props.i06.group.visible = (state.itemState === "revealed");
          const fall = smoothstep((p - 0.58) / 0.28);
          props.i06.group.position.set(0, lerp(1.92, cfg.dishPos[1] + 0.08, fall), lerp(0.68, cfg.dishPos[2], fall));
          state.statusText = p >= 0.96 ? "G01 完了：白鍵I06取得済（受け皿空）" : "G01 M08：水滴→上下くちばし開→白鍵が受け皿へ落下";
        }
        return;
      }

      if (sceneId === "N03") {
        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = Math.PI;
        const p = smoothstep(sec / 2.4);
        props.i08.group.visible = true;
        props.i08.group.position.set(0, 1.48, lerp(1.05, 0.66, Math.min(1, p * 2)));
        props.i09.group.visible = (v === "bothPlaced");
        props.i09.group.position.set(0, 1.24, lerp(1.05, 0.66, Math.min(1, p * 2)));
        if (v === "oneOnlyFail") {
          state.itemState = "hidden";
          props.astro.update(sec);
          props.i10.group.visible = false;
          state.statusText = "N03 失敗見本：I08片方のみ（留め金閉鎖維持・I10未出現）";
        } else {
          if (p < 0.55) props.astro.update(sec);
          state.itemState = p >= 0.96 ? "acquired" : (p > 0.65 ? "revealed" : "hidden");
          props.i10.group.visible = (state.itemState === "revealed");
          props.i10.group.position.set(0.38, 1.18, lerp(0.62, 0.95, smoothstep((p - 0.65) / 0.3)));
          state.statusText = p >= 0.96 ? "N03 完了：I10取得済（右下留め金空）" : "N03 M12：I08+I09揃い→回転輪停止→右下からI10外れ";
        }
        return;
      }

      if (sceneId === "E02") {
        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = -Math.PI / 2;
        const p = smoothstep(sec / 2.2);
        const openP = smoothstep(p / 0.5);
        props.lid.rotation.z = openP * (75 * Math.PI / 180);
        if (p < 0.25) {
          state.itemState = "hidden";
          props.item.group.visible = false;
          props.wornCloak.group.visible = false;
        } else if (p < 0.78) {
          state.itemState = "revealed";
          props.item.group.visible = true;
          props.wornCloak.group.visible = false;
          const q = smoothstep((p - 0.35) / 0.43);
          props.item.group.position.set(lerp(-2.4, -1.25, q), lerp(0.62, 1.25, q), 0);
        } else {
          // 完了時：箱内は空にし、主人公の肩へ実際にマントを装着表示！
          state.itemState = "acquired";
          props.item.group.visible = false;
          props.wornCloak.group.visible = true;
        }
        state.statusText = state.itemState === "acquired"
          ? "E02 完了：I07マントを主人公の肩へ装着表示（星箱内は空）"
          : "E02 M09：I02で布留め解除→星箱蓋75°開→星裏地確認";
        return;
      }

      if (sceneId === "W02") {
        const p = smoothstep(sec / 3.4);
        const hz = lerp(5.1, -4.7, p);
        hero.rig.position.set(-2.8, 0, hz); hero.rig.rotation.y = Math.PI;
        if (p < 0.96) charApi.applyPose(hero.charObj, "walk", sec * 2.4);
        const litCount = Math.max(0, 10 - Math.floor(p * 11));
        props.hemStars.forEach(function (st, idx) { st.position.z = hz + 0.15; st.visible = idx < litCount; });
        state.itemState = p >= 0.96 ? "acquired" : "revealed";
        props.item.group.visible = p > .76 && state.itemState !== "acquired";
        props.item.group.position.set(cfg.itemPos[0], cfg.itemPos[1], cfg.itemPos[2]);
        state.statusText = p >= 0.96 ? "W02 完了：逆光窓で読取→I08取得済" : "W02 M10：裏見台通過中（裾模様残り " + litCount + "/10）";
        return;
      }

      if (sceneId === "S04") {
        hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = Math.PI;
        actors.npc.rig.position.set(cfg.npcPos[0], 0, cfg.npcPos[2]); actors.npc.rig.rotation.y = -0.35;
        if (v === "noSaluteClosed") {
          props.innerGrate.position.y = 0;
          state.statusText = "S04 礼法なし：単一内格子・奥の外扉と閂とも閉鎖維持";
        } else if (sec < 0.6) {
          const tap = Math.sin((sec / 0.3) * Math.PI * 2);
          hero.charObj.rightArm.shoulder.rotation.set(-0.95, 0, 0.42);
          hero.charObj.rightArm.elbow.rotation.x = -1.15 - Math.max(0, tap) * 0.22;
          props.innerGrate.position.y = 0;
          state.statusText = "S04 E152：右手で右胸を0.3秒間隔で2回叩く";
        } else if (sec < 1.4) {
          const bow = Math.sin(clamp01((sec - 0.6) / 0.8) * Math.PI) * (25 * Math.PI / 180);
          hero.charObj.upperBody.rotation.x = bow;
          props.innerGrate.position.y = 0;
          state.statusText = "S04 E152：約25度の一礼";
        } else {
          const op = smoothstep((sec - 1.4) / 1.0);
          props.innerGrate.position.y = op * 2.6;
          state.statusText = "S04 E152：ウル(P24)が単一内格子(Z=-5.5)を開放（奥の外扉・閂は閉鎖維持・脱出不可）";
        }
        return;
      }

      // 共通重要品・人物場面（W01, E01, N01, N02, S02, E03, W03, S03, E07）
      const p = smoothstep(sec / 2.2);
      if (cfg.heroPos) { hero.rig.position.set(cfg.heroPos[0], 0, cfg.heroPos[2]); hero.rig.rotation.y = Math.PI; }
      if (actors.npc && cfg.npcPos) { actors.npc.rig.position.set(cfg.npcPos[0], 0, cfg.npcPos[2]); actors.npc.rig.rotation.y = 0.25; }
      if (actors.npc2 && cfg.npc2Pos) { actors.npc2.rig.position.set(cfg.npc2Pos[0], 0, cfg.npc2Pos[2]); actors.npc2.rig.rotation.y = -0.35; }

      if (sceneId === "W03") {
        // 肖像額を実際に約10度(-10°)傾ける→目高さに文字が映る→東机で手帳I12記入
        const tiltP = smoothstep(p / 0.45);
        props.portraitPivot.rotation.x = -tiltP * (10 * Math.PI / 180);
        props.secretTextGlow.material.opacity = tiltP > 0.7 ? (tiltP - 0.7) / 0.3 : 0;
        if (p > 0.5) {
          const q = (p - 0.5) * 2;
          hero.rig.position.set(lerp(0, cfg.deskPos[0] - 0.6, q), 0, lerp(-0.9, cfg.deskPos[2], q));
          hero.rig.rotation.y = Math.PI / 2;
        }
        state.itemState = p >= 0.96 ? "acquired" : (p > 0.55 ? "revealed" : "hidden");
        props.item.group.visible = (p > 0.55);
        props.item.group.rotation.x = -Math.PI / 2;
        props.item.group.position.set(cfg.deskPos[0], cfg.deskPos[1] + 0.04, cfg.deskPos[2]);
        state.statusText = p > 0.55 ? "W03 M14：額を10°傾け目高さ文字を確認→東机で手帳I12へ書き写し" : "W03 M14：絵師マレ(P09)案内のもと肖像額を10度傾ける";
      } else if (sceneId === "S03") {
        // 前半でドル(P23)が槍受け(+1.6,0,-4.05)へ槍を預け、後半で盤指針→I13段差2切れ目指差し
        const rackDone = p > 0.38;
        if (actors.npc.charObj.mainProp) actors.npc.charObj.mainProp.visible = !rackDone;
        props.rackSpear.visible = rackDone;
        if (!rackDone) {
          actors.npc.rig.position.set(lerp(cfg.npcPos[0], cfg.spearRackPos[0] - 0.35, p / 0.38), 0, lerp(cfg.npcPos[2], cfg.spearRackPos[2] + 0.35, p / 0.38));
        } else {
          actors.npc.rig.position.set(cfg.npcPos[0], 0, cfg.npcPos[2]);
          actors.npc.charObj.rightArm.shoulder.rotation.set(-1.1, 0, 0.15);
        }
        state.itemState = p >= 0.95 ? "acquired" : "revealed";
        props.item.group.visible = (state.itemState !== "acquired");
        props.item.group.position.set(cfg.itemPos[0], cfg.itemPos[1], cfg.itemPos[2] + p * 0.15);
        state.statusText = rackDone ? "S03 M15：ドル(P23)が槍を槍受けへ預け、指針とI13の2切れ目を指差し" : "S03 M15：鐘番ドル(P23)が槍を槍受け(+1.6,0,-4.05)へ預ける";
      } else if (sceneId === "S02") {
        hero.charObj.group.position.y = -0.22 * Math.sin(p * Math.PI);
        state.itemState = p >= 0.96 ? "acquired" : "revealed";
        props.item.group.visible = p > .23 && state.itemState !== "acquired";
        props.item.group.position.set(cfg.itemPos[0], cfg.itemPos[1], cfg.itemPos[2] + p * 0.10);
        state.statusText = p >= 0.96 ? "S02 完了：I09取得済（柱の溝は空）" : cfg.variants[0].label;
      } else if (sceneId === "E07") {
        actors.npc.rig.rotation.y = 0;
        actors.npc.charObj.rightArm.shoulder.rotation.x = -0.95 * Math.sin(p * Math.PI);
        props.item.group.visible = true;
        props.item.group.position.set(cfg.windowPos[0], cfg.windowPos[1], lerp(cfg.windowPos[2], cfg.heroPos[2] - 0.25, p));
        state.statusText = cfg.variants[0].label;
      } else {
        state.itemState = p >= 0.95 ? "acquired" : "revealed";
        if (props.item && cfg.itemPos) {
          props.item.group.visible = state.itemState !== "acquired" && (sceneId !== "E03" || p > .25);
          props.item.group.position.set(cfg.itemPos[0], cfg.itemPos[1] + 0.12 * Math.sin(p * Math.PI), cfg.itemPos[2] + 0.22 * p);
          if (sceneId === "N01") props.item.group.rotation.y = p * Math.PI;
        }
        state.statusText = p >= 0.95 ? cfg.title + "：完了（入手位置は空）" : cfg.variants[0].label;
      }
    }

    const totalDuration = sceneId === "W02" ? 3.6 : 2.6;
    return {
      id: sceneId, config: cfg, env: env, root: root,
      _inspect: { hero: hero, actors: actors, props: props, getState: function () { return { itemState: state.itemState }; } },
      applyGameState: applyGameStateSnapshot,
      setVariant: function (vid) { state.customGameState = null; state.holdingSnapshot = false; state.variant = vid; state.time = 0; state.playing = false; applyTimeline(0); },
      setPhase: function (ph) { state.customGameState = null; state.holdingSnapshot = false; state.playing = false; state.time = ph === "initial" ? 0 : (ph === "mid" ? totalDuration * 0.5 : totalDuration); applyTimeline(state.time); },
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
        if (state.holdingSnapshot) applyGameStateSnapshot(state.customGameState, elapsed);
        else applyTimeline(state.time);
      },
      dispose: function () {}
    };
  }

  global.CastleEscapeStage3 = {
    STAGE3_CONFIG: STAGE3_CONFIG,
    SCENE_ORDER: SCENE_ORDER,
    createSceneController: function (sceneId, options) {
      const ctrl = buildStage3Scene(sceneId, options || {});
      if (options && options.scene) options.scene.add(ctrl.root);
      return ctrl;
    }
  };
})(window);
