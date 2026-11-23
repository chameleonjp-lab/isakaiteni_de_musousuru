/**
 * 王都からの脱出 — 3D重要品13種(I01〜I13)＆主要ギミック造形(5種)ライブラリ v2 (高精細リアリティ版)
 * 収録:
 *   - I01〜I13: シナリオ必須の重要アイテム全13種（CanvasTexture＋多部品造形）
 *   - PROP_HERON(雨量計の鷺), PROP_ASTRO(王家の星暦盤), PROP_STATUE(冠なき像),
 *     PROP_BOUNDARY(境石), PROP_THRONE(王の玉座)
 *
 * 使い方:
 *   const itemLib = window.CastleEscapeItems;
 *   const obj = itemLib.createItemOrProp("I06", { envMap });
 *   scene.add(obj.group);
 */
(function (global) {
  "use strict";

  const ITEM_SPECS = [
    { id: "I01", name: "綴じ穴のある備品図", loc: "W01 西資料室 (M03)", cat: "item",
      desc: "布印と波形の欠け縁・綴じ穴が残る旧配置図。東の布札・北の釉板・冬客間の柱に使う。" },
    { id: "I02", name: "燕尾の布札", loc: "E01 洗濯仕分け場 (M04)", cat: "item",
      desc: "尾が二股に分かれた布札。南返納庫の左溝と東廊下の星箱の留め具に合う。" },
    { id: "I03", name: "三溝の釉板", loc: "N01 窯見本室 (M05)", cat: "item",
      desc: "縁が波形に欠け、裏に三本の溝が走る青灰色の釉薬見本。南返納庫の右溝に合う。" },
    { id: "I04", name: "中空の調律棒", loc: "S01 南返納庫 (M06)", cat: "item",
      desc: "柄に中庭の鷺が刻まれた中空の真鍮棒。雨量庭園の鷺の左脚から水を抜く整備具。" },
    { id: "I05", name: "透明な救護札", loc: "N02 施療院 (M07)", cat: "item",
      desc: "透き窓に『雨仕舞い線・水鳥の左脚』が描かれた医務用透明札。調律棒の支えになる。" },
    { id: "I06", name: "首輪の白鍵", loc: "G01 雨量庭園 (M08)", cat: "item",
      desc: "鷺のくちばしから落ちる小さな白い魔道具鍵。無音祈祷室で翻訳の首輪を外す。" },
    { id: "I07", name: "隠密のマント", loc: "E02 東廊下・星箱 (M09)", cat: "item",
      desc: "星の裏地が視線から消える舞台用マント。1回10秒有効（奉納灯の影は隠せない）。" },
    { id: "I08", name: "王家の透かし帯", loc: "W02 織物回廊・裏見台 (M10)", cat: "item",
      desc: "逆光で『空席・欠け月』の切り欠きが浮かぶ王家の帯。星暦盤の冬至の窓に重ねる。" },
    { id: "I09", name: "伏せ舟の影板", loc: "S02 冬客間・背くらべ柱 (M11)", cat: "item",
      desc: "幼い王女が残した逆さ小舟の影板。縁の星形が北の星暦室の枠に合う。" },
    { id: "I10", name: "王女の星暦頁", loc: "N03 星暦室 (M12)", cat: "item",
      desc: "星穴の列が穿たれた王女の頁。鳩舎の返書筒の留めと、西の肖像額の裏打ちに合う。" },
    { id: "I11", name: "覗き錘（真鍮の卵）", loc: "E03 王家の鳩舎 (M13)", cat: "item",
      desc: "底に小さなレンズを備えた重心の偏った真鍮卵。肖像の私筆解読と旧礼拝堂の天秤に使う。" },
    { id: "I12", name: "王女の私筆の控え", loc: "W03 肖像修復室 (M14)", cat: "item",
      desc: "首輪を外した後も読めるよう、主人公が自筆の絵と文字で控えた脱出経路図。" },
    { id: "I13", name: "巡回環", loc: "S03 鐘番室 (M15)", cat: "item",
      desc: "二つの切れ目で西番の空番を指で読める現行の金属環。香車の返納予約に使う。" },

    // 主要3Dギミック造形 (5種)
    { id: "PROP_HERON", name: "雨量計の鷺（ギミック像）", loc: "G01 雨量庭園 (M08)", cat: "prop",
      desc: "左脚を上げた銅製の鷺。救護札と調律棒で水を抜くと、くちばしから白鍵が受け皿へ落ちる。" },
    { id: "PROP_ASTRO", name: "王家の星暦盤", loc: "N03 星暦室 (M12)", cat: "prop",
      desc: "冬至の窓を持つ巨大な真鍮の天球星暦盤。透かし帯と影板を重ねると星暦頁が外れる。" },
    { id: "PROP_STATUE", name: "冠なき像（隠し入口）", loc: "Q03 旧礼拝堂 (M19)", cat: "prop",
      desc: "四体のうち唯一冠のない石像。背の空の巣に覗き錘を戻すと床が下がり王家の階段が現れる。" },
    { id: "PROP_BOUNDARY", name: "境石（城内と外の境界）", loc: "Q05 境石と外の草地 (M20)", cat: "prop",
      desc: "王冠が城側を向いて刻まれた境界石。内から外の草地へ踏み越えた瞬間に脱出クリア。" },
    { id: "PROP_THRONE", name: "王の玉座", loc: "C01 玉座の間 (M01-M02)", cat: "prop",
      desc: "赤絨毯の階段上に据えられた金装飾と深紅ベルベットの玉座。" }
  ];

  // ===== Procedural CanvasTexture Helpers (cached) =====
  const texCache = {};
  function makeTex(key, w, h, drawFn) {
    if (texCache[key]) return texCache[key];
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    drawFn(ctx, w, h);
    const tx = new THREE.CanvasTexture(cv);
    tx.encoding = THREE.sRGBEncoding;
    tx.anisotropy = 4;
    tx.castleShared = true;
    texCache[key] = tx;
    return tx;
  }

  function texBlueprint() {
    return makeTex("i01_blueprint", 512, 640, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#efe1bf"); g.addColorStop(0.5, "#e6d2a4"); g.addColorStop(1, "#d4bc88");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Aged stains & fiber
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = "rgba(120,86,44," + (0.03 + (i % 5) * 0.012) + ")";
        ctx.beginPath(); ctx.arc((i * 83) % w, (i * 127) % h, 14 + (i % 24), 0, Math.PI * 2); ctx.fill();
      }
      // Double decorative border
      ctx.strokeStyle = "#4d3620"; ctx.lineWidth = 5; ctx.strokeRect(48, 34, w - 76, h - 68);
      ctx.lineWidth = 2; ctx.strokeRect(58, 44, w - 96, h - 88);
      // Architectural floorplan lines
      ctx.strokeStyle = "#3a2918"; ctx.lineWidth = 3;
      ctx.strokeRect(92, 96, 320, 210);
      ctx.beginPath();
      ctx.moveTo(200, 96); ctx.lineTo(200, 306);
      ctx.moveTo(310, 96); ctx.lineTo(310, 230);
      ctx.moveTo(92, 195); ctx.lineTo(412, 195);
      ctx.stroke();
      // Compass rose & annotations
      ctx.strokeStyle = "#5c3f24"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(360, 420, 44, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(360, 368); ctx.lineTo(360, 472); ctx.moveTo(308, 420); ctx.lineTo(412, 420); ctx.stroke();
      // Red cloth seal stamp
      ctx.strokeStyle = "#9c2424"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(155, 455, 42, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(156,36,36,0.16)"; ctx.fill();
      ctx.fillStyle = "#8c1d1d"; ctx.font = "bold 24px serif"; ctx.textAlign = "center";
      ctx.fillText("布印", 155, 464);
      // Handwritten ink notes
      ctx.fillStyle = "#3a2816"; ctx.font = "18px serif"; ctx.textAlign = "left";
      ctx.fillText("王城旧備品配置図", 102, 82);
      ctx.fillText("東：燕尾布札 / 北：三溝釉板", 96, 345);
      ctx.fillText("南返納庫 照合控", 96, 376);
    });
  }

  function texClothTag() {
    return makeTex("i02_cloth", 256, 512, function (ctx, w, h) {
      ctx.fillStyle = "#1d3566"; ctx.fillRect(0, 0, w, h);
      // Woven linen crosshatch
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let x = 0; x < w; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      // Gold stitched border
      ctx.strokeStyle = "#e6be58"; ctx.lineWidth = 4; ctx.setLineDash([10, 6]);
      ctx.strokeRect(18, 22, w - 36, h - 100);
      ctx.setLineDash([]);
      // Embroidered royal swallowtail star crest
      ctx.strokeStyle = "#f2cf70"; ctx.fillStyle = "#f2cf70"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w / 2, 185, 48, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 36 : 14;
        const x = w / 2 + Math.cos(a) * r, y = 185 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e8d294"; ctx.font = "bold 26px serif"; ctx.textAlign = "center";
      ctx.fillText("東・洗濯", w / 2, 290);
    });
  }

  function texGlaze() {
    return makeTex("i03_glaze", 256, 256, function (ctx, w, h) {
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 18, w * 0.5, h * 0.5, w * 0.72);
      g.addColorStop(0, "#9ab6c2"); g.addColorStop(0.55, "#688594"); g.addColorStop(1, "#3f5563");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Celadon crackle glaze lines
      ctx.strokeStyle = "rgba(230,242,248,0.22)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        const x0 = (i * 47) % w, y0 = (i * 73) % h;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + ((i % 3) - 1) * 45 + 22, y0 + ((i % 2) ? 38 : -32));
        ctx.stroke();
      }
      // Kiln stamp
      ctx.strokeStyle = "rgba(35,45,52,0.55)"; ctx.lineWidth = 3;
      ctx.strokeRect(174, 178, 46, 46);
      ctx.fillStyle = "rgba(35,45,52,0.65)"; ctx.font = "bold 20px serif"; ctx.textAlign = "center";
      ctx.fillText("窯", 197, 209);
    });
  }

  function texMedicalPass() {
    return makeTex("i05_med", 384, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(210, 240, 252, 0.28)"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      // Etched rain-drain line & waterbird left leg diagram
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(46, 170); ctx.lineTo(338, 170); ctx.stroke();
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(192, 62); ctx.lineTo(192, 206); ctx.stroke();
      ctx.setLineDash([]);
      // Stylized heron left leg icon
      ctx.beginPath();
      ctx.moveTo(175, 86); ctx.lineTo(192, 132); ctx.lineTo(222, 118);
      ctx.moveTo(192, 132); ctx.lineTo(192, 170);
      ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("雨仕舞い線・水鳥左脚", w / 2, 224);
    });
  }

  function texStarCloak() {
    return makeTex("i07_starcloak", 512, 512, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0b142c"); g.addColorStop(0.5, "#111f47"); g.addColorStop(1, "#070c1c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Constellation lines
      ctx.strokeStyle = "rgba(240,210,130,0.28)"; ctx.lineWidth = 1.5;
      const pts = [[90,110],[180,150],[260,120],[360,190],[410,300],[290,340],[150,310],[110,410]];
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
      ctx.stroke();
      // Twinkling gold & silver stars
      for (let i = 0; i < 95; i++) {
        const x = (i * 97 + 23) % w, y = (i * 151 + 41) % h;
        const r = (i % 7 === 0) ? 4.2 : (i % 3 === 0 ? 2.4 : 1.3);
        ctx.fillStyle = (i % 5 === 0) ? "#ffe89e" : "#d8e9ff";
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  function texRoyalObi() {
    return makeTex("i08_obi", 512, 256, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#4f1c2e"); g.addColorStop(0.32, "#732842");
      g.addColorStop(0.5, "#9c6d36"); g.addColorStop(0.68, "#732842"); g.addColorStop(1, "#4f1c2e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Gold brocade borders
      ctx.fillStyle = "#e6be58"; ctx.fillRect(0, 14, w, 12); ctx.fillRect(0, h - 26, w, 12);
      // Translucent backlit center window with crescent moon & empty seat
      ctx.fillStyle = "#fce7a8"; ctx.fillRect(190, 42, 132, h - 84);
      ctx.strokeStyle = "#4f1c2e"; ctx.lineWidth = 4; ctx.strokeRect(190, 42, 132, h - 84);
      // Crescent moon
      ctx.fillStyle = "#4f1c2e";
      ctx.beginPath(); ctx.arc(236, 128, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fce7a8";
      ctx.beginPath(); ctx.arc(248, 120, 26, 0, Math.PI * 2); ctx.fill();
      // Empty seat silhouette
      ctx.strokeStyle = "#4f1c2e"; ctx.lineWidth = 4;
      ctx.strokeRect(272, 114, 30, 42);
      ctx.beginPath(); ctx.moveTo(272, 136); ctx.lineTo(302, 136); ctx.stroke();
    });
  }

  function texStarPage() {
    return makeTex("i10_starpage", 512, 640, function (ctx, w, h) {
      ctx.fillStyle = "#f5ead0"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#c99b3b"; ctx.lineWidth = 6; ctx.strokeRect(24, 24, w - 48, h - 48);
      // Celestial arcs
      ctx.strokeStyle = "#2b426b"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(w / 2, h * 0.44, 150, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.44, 105, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.44, 60, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(a) * 60, h * 0.44 + Math.sin(a) * 60);
        ctx.lineTo(w / 2 + Math.cos(a) * 150, h * 0.44 + Math.sin(a) * 150);
        ctx.stroke();
      }
      ctx.fillStyle = "#2b426b"; ctx.font = "bold 24px serif"; ctx.textAlign = "center";
      ctx.fillText("冬至の窓 — 王女星暦頁", w / 2, 82);
    });
  }

  function texEscapeNotes() {
    return makeTex("i12_notes", 512, 384, function (ctx, w, h) {
      ctx.fillStyle = "#f4ebd6"; ctx.fillRect(0, 0, w, h);
      // Center fold shadow
      const cg = ctx.createLinearGradient(w / 2 - 24, 0, w / 2 + 24, 0);
      cg.addColorStop(0, "rgba(0,0,0,0)"); cg.addColorStop(0.5, "rgba(60,40,20,0.28)"); cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.fillRect(w / 2 - 24, 0, 48, h);
      // Left page: sketched route map
      ctx.strokeStyle = "#36281c"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(48, 300); ctx.lineTo(95, 220); ctx.lineTo(165, 210); ctx.lineTo(205, 95); ctx.stroke();
      [[48,300],[95,220],[165,210],[205,95]].forEach(function (p) {
        ctx.fillStyle = "#a82424"; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI * 2); ctx.fill();
      });
      // Right page: handwritten lines
      ctx.fillStyle = "#2b2016"; ctx.font = "bold 20px serif";
      ctx.fillText("脱出経路の控え", 286, 68);
      ctx.font = "16px serif";
      ["1. 無音祈祷室で首輪を外す", "2. 白礼拝廊は暗い百合側", "3. 旧礼拝堂の冠なき像", "4. 王家の地下抜け道へ", "5. 境石を越えて外へ"].forEach(function (ln, idx) {
        ctx.fillText(ln, 280, 118 + idx * 42);
      });
    });
  }

  function texWood() {
    return makeTex("item_wood", 256, 256, function (ctx, w, h) {
      ctx.fillStyle = "#4c2f1c"; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(32,18,8,0.22)" : "rgba(110,72,40,0.16)";
        ctx.fillRect(0, i * 5.4, w, 3);
      }
    });
  }

  function texMarble() {
    return makeTex("item_marble", 256, 256, function (ctx, w, h) {
      ctx.fillStyle = "#d9d6cf"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,115,108,0.22)"; ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath(); ctx.moveTo(0, (i * 31) % h);
        ctx.bezierCurveTo(80, (i * 53) % h, 170, (i * 19) % h, w, (i * 41) % h);
        ctx.stroke();
      }
    });
  }

  function createItemOrProp(id, options) {
    const spec = ITEM_SPECS.find(function (x) { return x.id === id; }) || ITEM_SPECS[0];
    const envMap = options && options.envMap ? options.envMap : null;
    const g = new THREE.Group();
    g.name = spec.id;
    const animators = [];

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8b948, roughness: 0.22, metalness: 0.9, envMap: envMap });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc99c3e, roughness: 0.28, metalness: 0.86, envMap: envMap });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x567469, roughness: 0.38, metalness: 0.72, envMap: envMap });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.42, metalness: 0.84, envMap: envMap });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf2e4c4, roughness: 0.85, side: THREE.DoubleSide });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9588, map: texMarble(), roughness: 0.86 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe2dfd7, map: texMarble(), roughness: 0.48 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x54341e, map: texWood(), roughness: 0.72 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, map: texWood(), roughness: 0.76 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x8f1821, roughness: 0.78 });

    if (id === "I01") {
      // 綴じ穴のある備品図: 波形に欠けた縁＋図面CanvasTexture＋真鍮ハトメ＆麻紐
      const sh = new THREE.Shape();
      sh.moveTo(-0.46, 0.58); sh.lineTo(0.46, 0.58); sh.lineTo(0.46, -0.34);
      sh.quadraticCurveTo(0.36, -0.44, 0.26, -0.38);
      sh.quadraticCurveTo(0.14, -0.52, 0.02, -0.46);
      sh.quadraticCurveTo(-0.12, -0.58, -0.26, -0.52);
      sh.lineTo(-0.46, -0.58); sh.closePath();
      const base = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), paperMat);
      base.position.z = -0.009; g.add(base);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.96), new THREE.MeshStandardMaterial({ map: texBlueprint(), roughness: 0.84 }));
      face.position.set(0.01, 0.07, 0.014); g.add(face);
      [-0.28, 0, 0.28].forEach(function (hy) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 8, 16), brassMat);
        ring.position.set(-0.37, hy, 0.016); g.add(ring);
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.032, 12), darkWoodMat);
        hole.rotation.x = Math.PI / 2; hole.position.set(-0.37, hy, 0); g.add(hole);
      });
      // Hemp binding cord loop
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 6, 16), new THREE.MeshStandardMaterial({ color: 0xb08c5a, roughness: 0.92 }));
      cord.rotation.y = Math.PI / 2; cord.position.set(-0.41, 0.28, 0.02); g.add(cord);

    } else if (id === "I02") {
      // 燕尾の布札: 織布テクスチャ＋金刺繍＋上部真鍮バー＆組み紐
      const shape = new THREE.Shape();
      shape.moveTo(-0.3, 0.56); shape.lineTo(0.3, 0.56); shape.lineTo(0.3, -0.56);
      shape.lineTo(0.0, -0.2); shape.lineTo(-0.3, -0.56); shape.closePath();
      const tag = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: 0x1d3566, roughness: 0.8 }));
      tag.position.z = -0.014; g.add(tag);
      const art = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), new THREE.MeshStandardMaterial({ map: texClothTag(), roughness: 0.76 }));
      art.position.set(0, 0.14, 0.024); g.add(art);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.68, 12), brassMat);
      bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.56, 0); g.add(bar);
      [-0.34, 0.34].forEach(function (bx) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), goldMat);
        cap.position.set(bx, 0.56, 0); g.add(cap);
      });
      // Braided cord
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9b24c, roughness: 0.65 }));
      cord.position.set(0, 0.56, 0); g.add(cord);

    } else if (id === "I03") {
      // 三溝の釉板: 波形欠け縁＋青磁貫入テクスチャ＋裏面の三本溝
      const sh = new THREE.Shape();
      sh.moveTo(-0.42, 0.42); sh.lineTo(0.42, 0.42); sh.lineTo(0.42, -0.22);
      sh.quadraticCurveTo(0.3, -0.34, 0.18, -0.26);
      sh.quadraticCurveTo(0.04, -0.42, -0.1, -0.34);
      sh.quadraticCurveTo(-0.26, -0.44, -0.42, -0.34); sh.closePath();
      const glazeMat = new THREE.MeshStandardMaterial({ map: texGlaze(), roughness: 0.18, metalness: 0.15, envMap: envMap });
      const tile = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3 }), glazeMat);
      tile.position.z = -0.045; g.add(tile);
      // Exposed terracotta clay back & 3 carved grooves
      const clayMat = new THREE.MeshStandardMaterial({ color: 0x8f6b54, roughness: 0.92 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.66, 0.025), clayMat);
      back.position.set(0, 0.06, -0.048); g.add(back);
      [-0.2, 0, 0.2].forEach(function (gx) {
        const gr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.032), new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.95 }));
        gr.position.set(gx, 0.06, -0.056); g.add(gr);
      });

    } else if (id === "I04") {
      // 中空の調律棒: 真鍮旋盤仕上げ＋中空の開口＋鷺の彫金バンド
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 1.38, 20, 1, true), brassMat);
      g.add(rod);
      // Hollow bore caps
      [0.69, -0.69].forEach(function (ey) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), goldMat);
        rim.rotation.x = Math.PI / 2; rim.position.y = ey; g.add(rim);
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), new THREE.MeshBasicMaterial({ color: 0x0b0907, side: THREE.DoubleSide }));
        hole.rotation.x = Math.PI / 2; hole.position.y = ey; g.add(hole);
      });
      // Turned decorative collars & engraved heron medallion
      [-0.42, -0.14, 0.16, 0.44].forEach(function (cy) {
        const col = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.014, 8, 20), goldMat);
        col.rotation.x = Math.PI / 2; col.position.y = cy; g.add(col);
      });
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 20), bronzeMat);
      grip.position.y = -0.28; g.add(grip);
      const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 16), goldMat);
      badge.position.y = 0.02; g.add(badge);
      g.rotation.z = -0.35;

    } else if (id === "I05") {
      // 透明な救護札: 真鍮フレーム＋磨りガラス透き窓＋雨仕舞い線エッチング
      const glassMat = new THREE.MeshStandardMaterial({ map: texMedicalPass(), transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.1, envMap: envMap, side: THREE.DoubleSide });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.62), glassMat);
      g.add(pane);
      // Beveled brass frame
      [[0, 0.32, 0.98, 0.045], [0, -0.32, 0.98, 0.045], [-0.47, 0, 0.045, 0.68], [0.47, 0, 0.045, 0.68]].forEach(function (f) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(f[2], f[3], 0.045), brassMat);
        bar.position.set(f[0], f[1], 0); g.add(bar);
      });
      // Corner rivets + top leather strap loop
      [[-0.47, 0.32], [0.47, 0.32], [-0.47, -0.32], [0.47, -0.32]].forEach(function (c) {
        const rv = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), goldMat);
        rv.position.set(c[0], c[1], 0.024); g.add(rv);
      });
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 8, 16), new THREE.MeshStandardMaterial({ color: 0x6b3e24, roughness: 0.82 }));
      loop.position.set(0, 0.41, 0); g.add(loop);

    } else if (id === "I06") {
      // 首輪の白鍵: 象牙・白磁の透かし持ち手＋金細工カラー＋繊細な鍵歯
      const ivoryMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fc, roughness: 0.18, metalness: 0.12, emissive: 0x1a2a3f, emissiveIntensity: 0.18, envMap: envMap });
      // Ornate trefoil bow
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.038, 12, 28), ivoryMat);
      bow.position.y = 0.42; g.add(bow);
      [[0, 0.56], [-0.14, 0.35], [0.14, 0.35]].forEach(function (p) {
        const lobe = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 16), ivoryMat);
        lobe.position.set(p[0], p[1], 0); g.add(lobe);
      });
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: 0.65, roughness: 0.1 }));
      gem.position.set(0, 0.42, 0); g.add(gem);
      // Gold filigree collar
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.052, 0.1, 14), goldMat);
      col.position.y = 0.17; g.add(col);
      // Tapered shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.82, 16), ivoryMat);
      shaft.position.y = -0.26; g.add(shaft);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), goldMat);
      tip.position.y = -0.68; g.add(tip);
      // Intricate warded bit
      const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.055, 0.036), ivoryMat); bit1.position.set(0.12, -0.58, 0); g.add(bit1);
      const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.048, 0.036), ivoryMat); bit2.position.set(0.09, -0.45, 0); g.add(bit2);
      const bit3 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.036), goldMat); bit3.position.set(0.21, -0.51, 0); g.add(bit3);

    } else if (id === "I07") {
      // 隠密のマント: 外側は深紺ベルベット・内側は星空星座裏地＋金留め具＆鎖
      const outerMat = new THREE.MeshStandardMaterial({ color: 0x161a2c, roughness: 0.85, side: THREE.FrontSide });
      const innerMat = new THREE.MeshStandardMaterial({ map: texStarCloak(), emissive: 0x1e3a8a, emissiveIntensity: 0.35, roughness: 0.45, side: THREE.BackSide });
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.68, 1.28, 22, 1, true, -Math.PI * 0.78, Math.PI * 1.56), outerMat);
      g.add(outer);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.67, 1.27, 22, 1, true, -Math.PI * 0.78, Math.PI * 1.56), innerMat);
      g.add(inner);
      // Hood & shoulder mantle
      const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.46, 0.36, 20, 1, true), outerMat);
      mantle.position.y = 0.48; g.add(mantle);
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), outerMat);
      hood.position.set(0, 0.66, -0.06); hood.rotation.x = -0.35; g.add(hood);
      // Gold clasp medallions & chain
      [-0.14, 0.14].forEach(function (cx) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.025, 14), goldMat);
        m.rotation.x = Math.PI / 2; m.position.set(cx, 0.56, 0.22); g.add(m);
      });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16, Math.PI), goldMat);
      chain.rotation.z = Math.PI; chain.position.set(0, 0.56, 0.22); g.add(chain);

    } else if (id === "I08") {
      // 王家の透かし帯: 金欄織＋逆光で光る欠け月・空席の透かし窓＋両端の金房
      const sashMat = new THREE.MeshStandardMaterial({ map: texRoyalObi(), emissive: 0x6b4512, emissiveIntensity: 0.22, roughness: 0.55, side: THREE.DoubleSide });
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = (t - 0.5) * 1.38;
        const z = Math.sin(t * Math.PI * 2) * 0.14;
        pts.push(new THREE.Vector3(x, 0, z));
      }
      const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.46, 24, 1), sashMat);
      const pos = ribbon.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        pos.setZ(i, Math.sin((px / 1.36) * Math.PI * 2) * 0.1);
      }
      ribbon.geometry.computeVertexNormals();
      g.add(ribbon);
      // Gold fringe tassels on both ends
      [-0.7, 0.7].forEach(function (ex) {
        for (let ty = -0.18; ty <= 0.18; ty += 0.06) {
          const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.14, 6), goldMat);
          fr.rotation.z = Math.PI / 2; fr.position.set(ex + (ex < 0 ? -0.06 : 0.06), ty, 0); g.add(fr);
        }
      });

    } else if (id === "I09") {
      // 伏せ舟の影板: 黒檀の逆さ小舟シルエット＋星形切り欠き＋螺鈿の星点
      const sh = new THREE.Shape();
      sh.moveTo(-0.58, -0.12); sh.quadraticCurveTo(-0.34, 0.34, 0, 0.36);
      sh.quadraticCurveTo(0.34, 0.34, 0.58, -0.12);
      sh.lineTo(0.28, -0.12); sh.lineTo(0.18, -0.24); sh.lineTo(0.08, -0.12);
      sh.lineTo(-0.08, -0.12); sh.lineTo(-0.18, -0.24); sh.lineTo(-0.28, -0.12); sh.closePath();
      const board = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.065, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3 }), darkWoodMat);
      board.position.z = -0.032; g.add(board);
      // Mother-of-pearl star inlays
      const pearlMat = new THREE.MeshStandardMaterial({ color: 0xeef6ff, emissive: 0x93c5fd, emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.3 });
      [[-0.26, 0.1], [0, 0.18], [0.26, 0.1]].forEach(function (sp) {
        const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), pearlMat);
        st.scale.set(1, 1, 0.35); st.position.set(sp[0], sp[1], 0.048); g.add(st);
      });
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.032, 0.08), brassMat);
      rim.position.set(0, -0.1, 0); g.add(rim);

    } else if (id === "I10") {
      // 王女の星暦頁: 金縁羊皮紙＋星暦図＋真鍮ハトメ星穴列＋深紅の栞紐
      const page = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.08, 0.024), new THREE.MeshStandardMaterial({ map: texStarPage(), roughness: 0.78 }));
      g.add(page);
      // Perforated star-hole column along right edge
      for (let i = 0; i < 6; i++) {
        const sy = 0.36 - i * 0.145;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 5), goldMat);
        rim.position.set(0.32, sy, 0.015); g.add(rim);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.022, 5), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
        glow.position.set(0.32, sy, 0.016); g.add(glow);
      }
      // Crimson bookmark ribbon
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.055, 1.24, 0.008), velvetMat);
      rib.position.set(-0.28, -0.08, 0.016); g.add(rib);

    } else if (id === "I11") {
      // 覗き錘（真鍮の卵）: 滑らかなLathe卵形＋赤道彫金リング＋底面光学レンズ＋上部吊り環
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const y = (t - 0.5) * 0.88;
        const r = Math.sin(t * Math.PI) * (0.28 + 0.07 * (1 - t));
        pts.push(new THREE.Vector2(Math.max(0.002, r), y));
      }
      const egg = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), brassMat);
      g.add(egg);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.022, 10, 28), goldMat);
      band.rotation.x = Math.PI / 2; band.position.y = -0.04; g.add(band);
      // Top bail ring
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.08, 12), goldMat);
      knob.position.y = 0.45; g.add(knob);
      const bail = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 18), goldMat);
      bail.position.y = 0.56; g.add(bail);
      // Bottom optical lens bezel + gleaming cyan glass dome
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.024, 10, 22), goldMat);
      bezel.rotation.x = Math.PI / 2; bezel.position.y = -0.42; g.add(bezel);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.06, metalness: 0.25, envMap: envMap }));
      lens.scale.set(1, 0.42, 1); lens.position.y = -0.43; g.add(lens);

    } else if (id === "I12") {
      // 王女の私筆の控え: 革表紙の見開き手帳＋手描き経路図ページ＋炭筆
      const cover = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.78, 0.04), new THREE.MeshStandardMaterial({ color: 0x5c321c, roughness: 0.78 }));
      cover.position.z = -0.022; g.add(cover);
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.78, 12), new THREE.MeshStandardMaterial({ color: 0x3b1e0f, roughness: 0.8 }));
      spine.position.set(0, 0, -0.02); g.add(spine);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.72, 0.05), paperMat);
      pages.position.z = 0.008; g.add(pages);
      const spread = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.7), new THREE.MeshStandardMaterial({ map: texEscapeNotes(), roughness: 0.85 }));
      spread.position.z = 0.035; g.add(spread);
      // Charcoal pencil resting across the corner
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), darkWoodMat);
      pencil.rotation.z = -0.45; pencil.position.set(0.34, -0.18, 0.06); g.add(pencil);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 8), ironMat);
      tip.rotation.z = -0.45; tip.position.set(0.51, 0.14, 0.06); g.add(tip);

    } else if (id === "I13") {
      // 巡回環: 二つの切れ目を持つ鍛造金属環＋真鍮刻印＋鍵シャックル
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.052, 14, 32, Math.PI * 1.48), ironMat);
      g.add(ring1);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.052, 14, 14, Math.PI * 0.34), brassMat);
      ring2.rotation.z = Math.PI * 1.58; g.add(ring2);
      // Tactile shift markers around the ring
      for (let i = 0; i < 6; i++) {
        const a = 0.35 + i * 0.65;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), goldMat);
        bead.position.set(Math.cos(a) * 0.41, Math.sin(a) * 0.41, 0); g.add(bead);
      }
      // Attached watchman shackle
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 18), brassMat);
      shackle.rotation.y = Math.PI / 2; shackle.position.set(0, 0.47, 0); g.add(shackle);

    } else if (id === "PROP_HERON") {
      // 雨量計の鷺: 彫刻石盤＋水面＋緑青銅の鷺（羽層・S字首・左脚バルブ・金くちばし）＋白鍵
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.96, 0.24, 24), stoneMat); base.position.y = -0.78; g.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.075, 10, 28), stoneMat); rim.rotation.x = Math.PI / 2; rim.position.y = -0.62; g.add(rim);
      const wat = new THREE.Mesh(new THREE.CircleGeometry(0.76, 24), new THREE.MeshStandardMaterial({ color: 0x3b869e, roughness: 0.12, metalness: 0.28, envMap: envMap }));
      wat.rotation.x = -Math.PI / 2; wat.position.y = -0.64; g.add(wat);
      // Plinth & heron legs
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.22, 16), stoneMat); plinth.position.y = -0.58; g.add(plinth);
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.88, 10), bronzeMat); rl.position.set(-0.07, -0.08, 0); g.add(rl);
      const llUp = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.42, 10), bronzeMat); llUp.position.set(0.09, 0.08, 0.14); llUp.rotation.x = 0.85; g.add(llUp);
      const valve = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 8, 14), goldMat); valve.position.set(0.09, -0.02, 0.28); g.add(valve);
      // Sculpted body & layered wings
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), bronzeMat); body.scale.set(0.78, 0.82, 1.48); body.position.set(0, 0.42, -0.02); g.add(body);
      [-1, 1].forEach(function (s) {
        const wing = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), bronzeMat);
        wing.scale.set(0.28, 0.72, 1.38); wing.position.set(s * 0.18, 0.44, -0.06); wing.rotation.z = s * -0.18; g.add(wing);
      });
      // S-curved neck, head, crest plume & golden beak
      const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.078, 0.4, 12), bronzeMat); n1.position.set(0, 0.68, 0.24); n1.rotation.x = 0.42; g.add(n1);
      const n2 = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.34, 12), bronzeMat); n2.position.set(0, 0.94, 0.28); n2.rotation.x = -0.22; g.add(n2);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), bronzeMat); hd.scale.set(0.85, 0.85, 1.25); hd.position.set(0, 1.09, 0.28); g.add(hd);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.26, 8), goldMat); plume.rotation.x = -1.25; plume.position.set(0, 1.15, 0.14); g.add(plume);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.38, 10), goldMat); beak.rotation.x = Math.PI / 2 + 0.18; beak.position.set(0, 1.04, 0.54); g.add(beak);
      // Key glint below beak
      const keyGlint = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xbae6fd, emissiveIntensity: 0.7 }));
      keyGlint.position.set(0, 0.92, 0.68); g.add(keyGlint);

    } else if (id === "PROP_ASTRO") {
      // 王家の星暦盤: 八角大理石台座＋回転天球儀3重輪＋冬至の窓＋太陽＆月球
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 0.78, 8), marbleMat); ped.position.y = -0.58; g.add(ped);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.08, 8), goldMat); collar.position.y = -0.18; g.add(collar);
      const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 10, 32, Math.PI), brassMat); cradle.rotation.z = Math.PI; cradle.position.y = 0.42; g.add(cradle);
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 10, 36), goldMat); r1.position.y = 0.42; g.add(r1);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.024, 10, 32), brassMat); r2.position.y = 0.42; r2.rotation.y = Math.PI / 3; g.add(r2);
      const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.02, 10, 28), goldMat); r3.position.y = 0.42; r3.rotation.x = Math.PI / 4; g.add(r3);
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffe07d, emissive: 0xf59e0b, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.7 }));
      sun.position.y = 0.42; g.add(sun);
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), new THREE.MeshStandardMaterial({ color: 0xdbeafe, emissive: 0x60a5fa, emissiveIntensity: 0.45 }));
      moon.position.set(0.38, 0.42, 0); r3.add(moon);
      animators.push(function (t) { r1.rotation.y = t * 0.35; r2.rotation.x = t * 0.5; r3.rotation.z = -t * 0.75; });

    } else if (id === "PROP_STATUE") {
      // 冠なき像: 段付き台座＋銘板＋ドレープ石像＋背面の空の巣
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.92), stoneMat); s1.position.y = -0.82; g.add(s1);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.46, 0.74), stoneMat); s2.position.y = -0.52; g.add(s2);
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.03), brassMat); plaque.position.set(0, -0.52, 0.38); g.add(plaque);
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 1.05, 16), marbleMat); robe.position.y = 0.24; g.add(robe);
      const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.34, 16), marbleMat); shawl.position.y = 0.62; g.add(shawl);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 12), marbleMat); neck.position.y = 0.84; g.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), marbleMat); head.position.y = 0.98; g.add(head);
      // Recessed empty nest on back
      const nest = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 16), stoneMat); nest.position.set(0, 0.56, -0.22); g.add(nest);
      const hollow = new THREE.Mesh(new THREE.CircleGeometry(0.085, 14), new THREE.MeshBasicMaterial({ color: 0x161412 }));
      hollow.rotation.y = Math.PI; hollow.position.set(0, 0.56, -0.23); g.add(hollow);

    } else if (id === "PROP_BOUNDARY") {
      // 境石: 苔むした境界石柱＋城側の金王冠レリーフ＋内外の地面コントラスト
      const innerSlab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.65), stoneMat); innerSlab.position.set(0, -0.78, 0.32); g.add(innerSlab);
      const outerGrass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.65), new THREE.MeshStandardMaterial({ color: 0x457d3b, roughness: 0.92 })); outerGrass.position.set(0, -0.78, -0.32); g.add(outerGrass);
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.48, 0.42), stoneMat); monolith.position.y = -0.02; g.add(monolith);
      monolith.userData.walkObstacle = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.28, 4), stoneMat); cap.rotation.y = Math.PI / 4; cap.position.y = 0.86; g.add(cap);
      // Inlaid royal crown facing castle side (+Z)
      const crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.04), goldMat); crownBase.position.set(0, 0.26, 0.22); g.add(crownBase);
      [-0.12, 0, 0.12].forEach(function (cx, i) {
        const pt = new THREE.Mesh(new THREE.ConeGeometry(0.05, i === 1 ? 0.18 : 0.13, 4), goldMat);
        pt.position.set(cx, 0.36 + (i === 1 ? 0.02 : 0), 0.22); g.add(pt);
      });

    } else if (id === "PROP_THRONE") {
      // 王の玉座: 赤絨毯段差＋ゴシック高背＋タフティング深紅クッション＋金装飾
      const dais = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.45), stoneMat); dais.position.y = -0.78; g.add(dais);
      const rug = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.24, 1.52), velvetMat); rug.position.y = -0.77; g.add(rug);
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.44, 0.78), darkWoodMat); seatBase.position.set(0, -0.46, -0.06); g.add(seatBase);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.14, 0.68), velvetMat); cushion.position.set(0, -0.2, -0.04); g.add(cushion);
      const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.38, 0.14), darkWoodMat); backFrame.position.set(0, 0.32, -0.4); g.add(backFrame);
      const backVelvet = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.12, 0.08), velvetMat); backVelvet.position.set(0, 0.3, -0.34); g.add(backVelvet);
      const crownCrest = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 4), goldMat); crownCrest.rotation.y = Math.PI / 4; crownCrest.position.set(0, 1.15, -0.4); g.add(crownCrest);
      [-0.44, 0.44].forEach(function (ax) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.78), darkWoodMat); arm.position.set(ax, -0.06, -0.04); g.add(arm);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.44, 10), goldMat); post.position.set(ax, -0.32, 0.32); g.add(post);
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), goldMat); finial.position.set(ax, 1.04, -0.4); g.add(finial);
      });
    }

    return {
      id: spec.id,
      spec: spec,
      group: g,
      update: function (t) { animators.forEach(function (fn) { fn(t); }); }
    };
  }

  global.CastleEscapeItems = {
    ITEM_SPECS: ITEM_SPECS,
    createItemOrProp: createItemOrProp
  };
})(window);
