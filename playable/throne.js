// Three.js scene, models and textures adapted from the project prototype.
function createCastleView(canvas, frame) {
  function createHallEnvMap() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#5c4a36");
    grad.addColorStop(0.35, "#a88f6d");
    grad.addColorStop(0.55, "#42352a");
    grad.addColorStop(1, "#1c1612");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    const wGrad = g.createRadialGradient(135, 95, 10, 135, 95, 95);
    wGrad.addColorStop(0, "rgba(255, 246, 220, 0.95)");
    wGrad.addColorStop(0.45, "rgba(255, 215, 145, 0.45)");
    wGrad.addColorStop(1, "rgba(255, 200, 120, 0)");
    g.fillStyle = wGrad;
    g.fillRect(0, 0, 300, 220);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }

  function createStoneTexture(baseHex, lineHex, tileX, tileY) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,248,235,0.05)" : "rgba(20,16,12,0.07)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 3);
    }
    g.strokeStyle = lineHex;
    g.lineWidth = 3;
    const rh = 64, cw = 64;
    for (let r = 0; r < 4; r++) {
      const y = r * rh;
      g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
      const offset = (r % 2) * 32;
      for (let col = 0; col <= 4; col++) {
        const x = (col * cw + offset) % 256;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + rh); g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(tileX || 4, tileY || 4);
    return tex;
  }

  function createCarpetTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, "#6e1319");
    grad.addColorStop(0.5, "#a3202a");
    grad.addColorStop(1, "#6e1319");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#d9a944";
    g.fillRect(14, 0, 10, 256);
    g.fillRect(232, 0, 10, 256);
    g.fillStyle = "#f2cf78";
    g.fillRect(29, 0, 3, 256);
    g.fillRect(224, 0, 3, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 7);
    return tex;
  }

  function createBannerTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#1b3461";
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = "#d4a648";
    g.lineWidth = 8;
    g.strokeRect(8, 8, 112, 240);
    g.fillStyle = "#e3b856";
    g.beginPath(); g.moveTo(64, 52); g.lineTo(94, 108); g.lineTo(64, 164); g.lineTo(34, 108); g.closePath(); g.fill();
    g.fillStyle = "#223f75";
    g.beginPath(); g.moveTo(64, 68); g.lineTo(82, 108); g.lineTo(64, 148); g.lineTo(46, 108); g.closePath(); g.fill();
    return new THREE.CanvasTexture(c);
  }

  function createArmorTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#d4dae4");
    grad.addColorStop(0.5, "#aeb7c6");
    grad.addColorStop(1, "#8c96a8");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 450; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(20,28,40,0.06)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 16, 1);
    }
    g.strokeStyle = "rgba(40,48,60,0.35)";
    g.lineWidth = 2;
    g.strokeRect(6, 6, 244, 244);
    return new THREE.CanvasTexture(c);
  }

  function createChainmailTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#3f4550";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#8c95a6";
    g.lineWidth = 1.6;
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        g.beginPath(); g.arc(x + ((y / 8) % 2) * 4, y, 3.2, 0, Math.PI * 2); g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  function createFabricTexture(baseHex, accentHex, style) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex;
    g.fillRect(0, 0, 256, 256);
    // Very fine subtle woven cloth texture (no chunky stripes!)
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.032)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    if (style === "royal") {
      g.fillStyle = accentHex || "#e0b34c";
      g.fillRect(0, 228, 256, 10);
      g.fillRect(0, 242, 256, 4);
    } else if (style === "ermine") {
      g.fillStyle = "#1f1d1a";
      for (let y = 18; y < 250; y += 36) {
        for (let x = 14 + ((y / 36) % 2) * 18; x < 250; x += 38) {
          g.beginPath(); g.ellipse(x, y, 2.8, 5.5, 0, 0, Math.PI * 2); g.fill();
        }
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createBumpNoise(strength, lineStep) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#808080";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) {
      const v = 128 + Math.floor((Math.random() - 0.5) * strength);
      g.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      g.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
    }
    if (lineStep) {
      g.strokeStyle = "#505050";
      g.lineWidth = 2;
      for (let y = 0; y < 256; y += lineStep) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createFaceTexture(opts) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = opts.skin || "#efc2a0";
    g.fillRect(0, 0, 512, 512);

    // Subtle warm skin shading across cheeks, forehead & jaw
    const faceGrad = g.createRadialGradient(256, 245, 20, 256, 256, 175);
    faceGrad.addColorStop(0, "rgba(255, 240, 226, 0.25)");
    faceGrad.addColorStop(0.7, "rgba(210, 145, 115, 0.08)");
    faceGrad.addColorStop(1, "rgba(145, 95, 72, 0.28)");
    g.fillStyle = faceGrad;
    g.fillRect(0, 0, 512, 512);

    // Cheek blush
    [206, 306].forEach(function (cx) {
      const cg = g.createRadialGradient(cx, 286, 4, cx, 286, 34);
      cg.addColorStop(0, opts.blush || "rgba(225, 128, 122, 0.28)");
      cg.addColorStop(1, "rgba(225, 128, 122, 0)");
      g.fillStyle = cg;
      g.fillRect(cx - 40, 246, 80, 80);
    });

    // Subtle eye socket shadow & detailed eyes (centered at x=256, y=246)
    const eyeY = 246, spread = 34;
    [-1, 1].forEach(function (side) {
      const ex = 256 + side * spread;
      const sg = g.createRadialGradient(ex, eyeY, 4, ex, eyeY, 24);
      sg.addColorStop(0, "rgba(115, 74, 56, 0.22)");
      sg.addColorStop(1, "rgba(115, 74, 56, 0)");
      g.fillStyle = sg;
      g.fillRect(ex - 26, eyeY - 26, 52, 52);

      // Sclera
      g.fillStyle = "#fcfcfc";
      g.beginPath();
      g.ellipse(ex, eyeY, 15, opts.eyeH || 9.5, 0, 0, Math.PI * 2);
      g.fill();

      // Iris gradient
      const ig = g.createRadialGradient(ex, eyeY + 1, 1, ex, eyeY, opts.irisR || 8.2);
      ig.addColorStop(0, opts.irisLight || opts.iris || "#4e7aa8");
      ig.addColorStop(0.75, opts.iris || "#2f4e70");
      ig.addColorStop(1, "#182230");
      g.fillStyle = ig;
      g.beginPath();
      g.arc(ex, eyeY, opts.irisR || 8.2, 0, Math.PI * 2);
      g.fill();

      // Pupil
      g.fillStyle = "#0e1014";
      g.beginPath();
      g.arc(ex, eyeY, 4.0, 0, Math.PI * 2);
      g.fill();

      // Twin catchlights
      g.fillStyle = "#ffffff";
      g.beginPath(); g.arc(ex - 3.0, eyeY - 2.6, 2.3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(ex + 3.2, eyeY + 2.4, 1.1, 0, Math.PI * 2); g.fill();

      // Upper & lower eyelid crease + lashes
      g.strokeStyle = "#221610";
      g.lineWidth = opts.lashW || 3.8;
      g.beginPath();
      g.arc(ex, eyeY + 2.5, 16, Math.PI * 1.12, Math.PI * 1.88);
      g.stroke();

      g.strokeStyle = "rgba(110, 68, 52, 0.45)";
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(ex, eyeY - 1.5, 17, Math.PI * 1.18, Math.PI * 1.82);
      g.stroke();

      // Sculpted eyebrow
      g.strokeStyle = opts.browColor || "#352218";
      g.lineWidth = opts.browW || 4.8;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(ex - 16, eyeY - 17);
      g.quadraticCurveTo(ex, eyeY - 23, ex + 16, eyeY - 16);
      g.stroke();
    });

    // Nose bridge highlight & nostril shadow
    g.fillStyle = "rgba(255, 244, 232, 0.35)";
    g.fillRect(253, 250, 6, 30);
    g.fillStyle = "rgba(120, 72, 54, 0.38)";
    g.beginPath(); g.ellipse(251, 286, 3.2, 2.0, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(261, 286, 3.2, 2.0, 0, 0, Math.PI * 2); g.fill();

    // Lips (upper + lower with soft highlight)
    g.fillStyle = opts.lipColor || "#c97a72";
    g.beginPath();
    g.moveTo(240, 314);
    g.quadraticCurveTo(256, 306, 272, 314);
    g.quadraticCurveTo(256, 323, 240, 314);
    g.fill();
    g.strokeStyle = "rgba(115, 55, 50, 0.45)";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(241, 314); g.lineTo(271, 314); g.stroke();

    return new THREE.CanvasTexture(c);
  }

  // =========================================================================
  // 3. THREE.JS SCENE & CONNECTED 3D CASTLE ARCHITECTURE
  // =========================================================================
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "low-power" });
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1f1913);
  scene.fog = new THREE.FogExp2(0x2c2319, 0.019);

  const camera = new THREE.PerspectiveCamera(56, 9 / 16, 0.1, 90);
  const hallEnvMap = createHallEnvMap();
  scene.environment = hallEnvMap;

  // Shared Materials
  const stoneFloorMat = new THREE.MeshStandardMaterial({ map: createStoneTexture("#7c7163", "#584e43", 10, 12), roughness: 0.88 });
  const stoneWallMat = new THREE.MeshStandardMaterial({ map: createStoneTexture("#8d8070", "#655a4e", 4, 3), roughness: 0.92 });
  const stonePillarMat = new THREE.MeshStandardMaterial({ map: createStoneTexture("#968a7a", "#6d6255", 2, 5), roughness: 0.85 });
  const carpetMat = new THREE.MeshStandardMaterial({ map: createCarpetTexture(), roughness: 0.82 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b647, roughness: 0.22, metalness: 0.9, envMap: hallEnvMap, envMapIntensity: 1.25 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4b2e1b, roughness: 0.72 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 0.65 });
  const velvetRedMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#8c1721", "#e6b647", "royal"), roughness: 0.72 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2b2d34, roughness: 0.45, metalness: 0.82, envMap: hallEnvMap });
  const steelBump = createBumpNoise(32, 64);
  const fabricBump = createBumpNoise(42, 0);
  const chainBump = createChainmailTexture();
  const armorMat = new THREE.MeshStandardMaterial({ map: createArmorTexture(), bumpMap: steelBump, bumpScale: 0.015, color: 0xd4dce8, roughness: 0.2, metalness: 0.92, envMap: hallEnvMap, envMapIntensity: 1.4 });
  const darkPlateMat = new THREE.MeshStandardMaterial({ map: createArmorTexture(), bumpMap: steelBump, bumpScale: 0.015, color: 0x5c6678, roughness: 0.3, metalness: 0.85, envMap: hallEnvMap, envMapIntensity: 1.15 });
  const steelBladeMat = new THREE.MeshStandardMaterial({ color: 0xeef3fa, roughness: 0.12, metalness: 0.98, envMap: hallEnvMap, envMapIntensity: 1.65 });
  const darkArmorMat = new THREE.MeshStandardMaterial({ map: chainBump, bumpMap: chainBump, bumpScale: 0.03, color: 0x6c7585, roughness: 0.44, metalness: 0.78, envMap: hallEnvMap });
  const contactShadowMat = new THREE.MeshBasicMaterial({ color: 0x090705, transparent: true, opacity: 0.34, depthWrite: false });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c4a3, roughness: 0.58 });
  const sharedCapeMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#1f3a6d", "#e6b647", "royal"), roughness: 0.72, side: THREE.DoubleSide });
  const sharedSurcoatMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#243f72", "#e0b34c", "royal"), roughness: 0.74 });
  const sharedSpearmanFaceMat = new THREE.MeshStandardMaterial({ map: createFaceTexture({ skin: "#e5b694", iris: "#353028", browColor: "#3a291e" }), roughness: 0.6 });
  const sharedPennantMat = new THREE.MeshStandardMaterial({ color: 0x9b1c26, roughness: 0.75, side: THREE.DoubleSide });

  // Lights
  scene.add(new THREE.HemisphereLight(0xffe6bd, 0x3b3026, 0.82));
  const sunLight = new THREE.DirectionalLight(0xffe1a8, 1.38);
  sunLight.position.set(-11, 14, 4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 16;
  sunLight.shadow.camera.top = 18;
  sunLight.shadow.camera.bottom = -18;
  scene.add(sunLight);

  const chandelierLight = new THREE.PointLight(0xffb55c, 1.15, 22, 1.4);
  chandelierLight.position.set(0, 7.6, -1.5);
  scene.add(chandelierLight);

  const westLight = new THREE.PointLight(0xffc97a, 0.9, 16, 1.5);
  westLight.position.set(-10.5, 4.5, 2.5);
  scene.add(westLight);

  const eastLight = new THREE.PointLight(0xffb86c, 0.95, 16, 1.5);
  eastLight.position.set(10.5, 4.5, 2.5);
  scene.add(eastLight);

  const gateLight = new THREE.PointLight(0xffe7b8, 1.0, 16, 1.4);
  gateLight.position.set(0, 5.2, 14.5);
  scene.add(gateLight);

  // --- Floor & Connected Castle Rooms ---
  // Main Floor covering Throne Room + West Archive + East Treasury + South Gate Hall
  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), stoneFloorMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(0, 0, 3.5);
  mainFloor.receiveShadow = true;
  scene.add(mainFloor);

  function addWall(x, y, z, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stoneWallMat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    m.castShadow = true;
    scene.add(m);
    return m;
  }

  // North back wall behind throne
  addWall(0, 6.2, -10.2, 18, 12.4, 0.6);

  // Throne Room West Wall (with open archway at z: 0.6 to 4.4 into West Archive Room)
  addWall(-7.2, 6.2, -4.8, 0.6, 12.4, 10.8);
  addWall(-7.2, 6.2, 8.6, 0.6, 12.4, 8.4);
  addWall(-7.2, 8.8, 2.5, 0.6, 7.2, 4.0); // Arch lintel

  // Throne Room East Wall (with open archway at z: 0.6 to 4.4 into East Guarded Corridor)
  addWall(7.2, 6.2, -4.8, 0.6, 12.4, 10.8);
  addWall(7.2, 6.2, 8.6, 0.6, 12.4, 8.4);
  addWall(7.2, 8.8, 2.5, 0.6, 7.2, 4.0); // Arch lintel

  // West Archive Room outer walls (x: -14.5 to -7.2, z: -2.2 to 7.2)
  addWall(-14.5, 4.5, 2.5, 0.6, 9, 9.8);
  addWall(-10.8, 4.5, -2.2, 7.6, 9, 0.6);
  addWall(-10.8, 4.5, 7.2, 7.6, 9, 0.6);

  // East Guarded Treasury Corridor outer walls (x: 7.2 to 15.0, z: -2.2 to 7.2)
  addWall(15.0, 4.5, 2.5, 0.6, 9, 9.8);
  addWall(11.1, 4.5, -2.2, 8.0, 9, 0.6);
  addWall(11.1, 4.5, 7.2, 8.0, 9, 0.6);

  // South Gate Corridor walls (x: -7.2 to 7.2, z: 12.8 to 17.5)
  addWall(-4.8, 5.2, 16.8, 5.4, 10.4, 0.6);
  addWall(4.8, 5.2, 16.8, 5.4, 10.4, 0.6);
  addWall(0, 8.2, 16.8, 4.6, 4.4, 0.6);

  // Massive South Castle Gate Doors (open when escaping!)
  const gateDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(2.1, 5.8, 0.25), darkWoodMat);
  gateDoorLeft.position.set(-1.05, 2.9, 16.8);
  scene.add(gateDoorLeft);
  const gateDoorRight = new THREE.Mesh(new THREE.BoxGeometry(2.1, 5.8, 0.25), darkWoodMat);
  gateDoorRight.position.set(1.05, 2.9, 16.8);
  scene.add(gateDoorRight);

  // Bright outside light beyond the South Gate
  const outsideGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 7),
    new THREE.MeshBasicMaterial({ color: 0xfff5d6, side: THREE.DoubleSide })
  );
  outsideGlow.position.set(0, 3.5, 18.2);
  scene.add(outsideGlow);

  // Stone Pillars & Wall Torches
  const torchFlames = [];
  [-8.2, -3.5, 5.8, 10.2].forEach(function (pz) {
    [-5.8, 5.8].forEach(function (px) {
      const pGroup = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 11.4, 12), stonePillarMat);
      shaft.position.y = 5.7;
      shaft.castShadow = true;
      pGroup.add(shaft);
      const dir = px < 0 ? 1 : -1;
      const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.42, 6), ironMat);
      sconce.position.set(dir * 0.64, 3.2, 0);
      sconce.rotation.z = -dir * 0.25;
      pGroup.add(sconce);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 7), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      flame.position.set(dir * 0.7, 3.5, 0);
      pGroup.add(flame);
      torchFlames.push({ mesh: flame, phase: Math.random() * 6 });
      pGroup.position.set(px, 0, pz);
      scene.add(pGroup);
    });
  });

  // Royal Blue Banners
  const bannerMat = new THREE.MeshStandardMaterial({ map: createBannerTexture(), roughness: 0.75, side: THREE.DoubleSide });
  [-2.8, 2.8].forEach(function (bx) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 6.2), bannerMat);
    banner.position.set(bx, 6.8, -9.82);
    scene.add(banner);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8), goldMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(bx, 9.95, -9.78);
    scene.add(rod);
  });

  // Red Carpet, Stairs & Royal Dais
  const aisleCarpet = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.03, 18.0), carpetMat);
  aisleCarpet.position.set(0, 0.015, 7.1);
  aisleCarpet.receiveShadow = true;
  scene.add(aisleCarpet);

  const stepCount = 5, stepHeight = 0.24, stepDepth = 0.52, stairsStartZ = -1.9;
  const daisY = stepCount * stepHeight;
  for (let i = 0; i < stepCount; i++) {
    const h = (i + 1) * stepHeight;
    const z = stairsStartZ - i * stepDepth;
    const stepStone = new THREE.Mesh(new THREE.BoxGeometry(8.2, h, stepDepth + 0.02), stonePillarMat);
    stepStone.position.set(0, h / 2, z);
    stepStone.receiveShadow = true;
    scene.add(stepStone);
    const stepCarpet = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.035, stepDepth + 0.04), carpetMat);
    stepCarpet.position.set(0, h + 0.015, z);
    scene.add(stepCarpet);
    const stepRiser = new THREE.Mesh(new THREE.BoxGeometry(3.4, stepHeight + 0.02, 0.035), carpetMat);
    stepRiser.position.set(0, h - stepHeight / 2, z + stepDepth / 2 + 0.015);
    scene.add(stepRiser);
  }
  const dais = new THREE.Mesh(new THREE.BoxGeometry(9.6, daisY, 5.8), stonePillarMat);
  dais.position.set(0, daisY / 2, -7.1);
  dais.receiveShadow = true;
  scene.add(dais);
  const daisCarpet = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.035, 5.4), carpetMat);
  daisCarpet.position.set(0, daisY + 0.018, -7.0);
  scene.add(daisCarpet);

  // Ornate Throne
  const throneGroup = new THREE.Group();
  const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.72, 1.3), darkWoodMat);
  throneSeat.position.set(0, 0.36, 0);
  throneGroup.add(throneSeat);
  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.0, 0.24), darkWoodMat);
  throneBack.position.set(0, 1.9, -0.58);
  throneGroup.add(throneBack);
  const backVelvet = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.45, 0.08), velvetRedMat);
  backVelvet.position.set(0, 1.95, -0.44);
  throneGroup.add(backVelvet);
  [-0.84, 0.84].forEach(function (tx) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 8), goldMat);
    post.position.set(tx, 1.7, -0.52);
    throneGroup.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 1.2), goldMat);
    arm.position.set(tx * 0.94, 1.15, 0.02);
    throneGroup.add(arm);
  });
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.15, 4), goldMat);
  crest.rotation.y = Math.PI / 4;
  crest.position.set(0, 3.85, -0.55);
  throneGroup.add(crest);
  throneGroup.position.set(0, daisY, -7.25);
  scene.add(throneGroup);

  // Volumetric Sunbeams & Dust
  const godRays = [];
  [-4.6, -1.0, 2.8].forEach(function (rz, idx) {
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 13.5),
      new THREE.MeshBasicMaterial({ color: 0xffe4aa, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    ray.position.set(-2.9, 5.2, rz);
    ray.rotation.z = -0.58;
    ray.rotation.y = 0.22;
    scene.add(ray);
    godRays.push({ mesh: ray, baseOpacity: 0.08 + idx * 0.01, phase: idx * 1.5 });
  });

  // --- Interactive Castle Props (Map Desk, Cloak Chest, Key Coffer, Red Herring Wine, Gate Notice) ---
  // 1. West Archive Desk + Castle Map Scroll
  const archiveDesk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.1), darkWoodMat);
  archiveDesk.position.set(-12.2, 0.45, 0.6);
  archiveDesk.castShadow = true;
  scene.add(archiveDesk);

  const mapScrollProp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.65, 10),
    new THREE.MeshStandardMaterial({ color: 0xf0deb4, roughness: 0.75, emissive: 0x5c4616, emissiveIntensity: 0.35 })
  );
  mapScrollProp.rotation.z = Math.PI / 2;
  mapScrollProp.position.set(-12.2, 0.98, 0.6);
  scene.add(mapScrollProp);

  // 2. Red Herring Item: Dusty Royal Wine Bottle on West Shelf
  const wineProp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.11, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a5436, roughness: 0.25, metalness: 0.2 })
  );
  wineProp.position.set(-11.4, 1.1, 0.7);
  scene.add(wineProp);

  // 3. East Corridor: Stealth Cloak Chest (Safe side)
  const cloakChest = new THREE.Group();
  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.62, 0.65), darkWoodMat);
  chestBox.position.y = 0.31;
  cloakChest.add(chestBox);
  const chestBand = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 0.68), goldMat);
  chestBand.position.y = 0.56;
  cloakChest.add(chestBand);
  cloakChest.position.set(9.2, 0, 5.6);
  scene.add(cloakChest);

  // 4. East Treasury Alcove (Restricted Zone!): Glowing Collar Key Pedestal
  const keyPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.0, 12), stonePillarMat);
  keyPedestal.position.set(13.4, 0.5, 0.6);
  scene.add(keyPedestal);

  const keyProp = new THREE.Group();
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 14), goldMat);
  const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8), goldMat);
  keyShaft.position.y = -0.22;
  const keyTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.03), goldMat);
  keyTeeth.position.set(0.05, -0.3, 0);
  keyProp.add(keyRing, keyShaft, keyTeeth);
  keyProp.position.set(13.4, 1.38, 0.6);
  scene.add(keyProp);

  // Red floor warning line marking the Restricted East Treasury Zone
  const restrictedLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 8.8),
    new THREE.MeshBasicMaterial({ color: 0xe24444, transparent: true, opacity: 0.7 })
  );
  restrictedLine.rotation.x = -Math.PI / 2;
  restrictedLine.position.set(11.3, 0.025, 2.5);
  scene.add(restrictedLine);

  // 5. South Hall Notice Board (Clue for passing Gatekeeper without language)
  const noticeBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.12), darkWoodMat);
  noticeBoard.position.set(-4.4, 1.5, 11.4);
  noticeBoard.rotation.y = 0.45;
  scene.add(noticeBoard);
  const noticePaper = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.1), new THREE.MeshStandardMaterial({ color: 0xf4e8c8 }));
  noticePaper.position.set(-4.33, 1.55, 11.46);
  noticePaper.rotation.y = 0.45;
  scene.add(noticePaper);

  // =========================================================================
  // 4. CLEAN, UNIFIED +Z-FORWARD REALISTIC 3D CHARACTER BUILDERS
  //    (Explicit 3D facial features facing +Z, full gap-free sculpted hair,
  //     refined Gothic plate armor, authentic maid outfit, crisp proportions)
  // =========================================================================
  function makeLathe(pairs, segments, mat) {
    const pts = pairs.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    return new THREE.Mesh(new THREE.LatheGeometry(pts, segments || 20), mat);
  }

  function addContactShadow(root, radius) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(radius || 0.4, 18), contactShadowMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.022;
    root.add(disc);
  }

  // Shared eye & facial materials
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfbfcff, roughness: 0.25 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111318 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lashMat = new THREE.MeshBasicMaterial({ color: 0x1c1410 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xe88b92, transparent: true, opacity: 0.28, depthWrite: false });

  // Unified Realistic Head facing +Z (EXPLICIT 3D eyes, brows, nose, lips, ears — impossible to flip or distort!)
  function createHumanHead(opts) {
    const g = new THREE.Group();
    const r = (opts && opts.radius) || 0.132;
    const skinC = (opts && opts.skinColor) || 0xf2c8a8;
    const irisC = (opts && opts.irisColor) || 0x2d4a6e;
    const browC = (opts && opts.browColor) || 0x2a1c14;
    const lipC = (opts && opts.lipColor) || 0xc87a74;
    const isFemale = !!(opts && opts.female);

    const headSkinMat = new THREE.MeshStandardMaterial({ color: skinC, roughness: 0.56, metalness: 0.02 });
    const irisMat = new THREE.MeshStandardMaterial({ color: irisC, roughness: 0.2, metalness: 0.05 });
    const browMat = new THREE.MeshStandardMaterial({ color: browC, roughness: 0.75 });
    const lipMat = new THREE.MeshStandardMaterial({ color: lipC, roughness: 0.45 });

    // Smooth oval cranium & jaw (zero protruding chin balls!)
    const skull = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 20), headSkinMat);
    skull.scale.set(0.92, 1.08, 0.96);
    g.add(skull);

    // Subtle 3D Ears on left & right (-X, +X)
    [-r * 0.9, r * 0.9].forEach(function (ex) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(r * 0.19, 10, 8), headSkinMat);
      ear.scale.set(0.42, 1.2, 0.75);
      ear.position.set(ex, -r * 0.04, -r * 0.02);
      g.add(ear);
    });

    // Crisp 3D Eyes on +Z front face!
    const eyeY = r * 0.08;
    const eyeX = r * 0.33;
    const eyeZ = r * 0.87;
    [-1, 1].forEach(function (side) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * eyeX, eyeY, eyeZ);
      eyeGroup.rotation.y = side * 0.24;

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(r * (isFemale ? 0.175 : 0.15), 12, 10), scleraMat);
      sclera.scale.set(1.15, isFemale ? 0.88 : 0.72, 0.35);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(r * (isFemale ? 0.115 : 0.095), 12, 10), irisMat);
      iris.scale.set(1.0, 1.0, 0.38);
      iris.position.set(0, 0, r * 0.032);
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 0.055, 8, 8), pupilMat);
      pupil.scale.set(1.0, 1.0, 0.35);
      pupil.position.set(0, 0, r * 0.055);
      eyeGroup.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(r * 0.024, 6, 6), catchlightMat);
      glint.position.set(-r * 0.032, r * 0.032, r * 0.068);
      eyeGroup.add(glint);

      // Upper lash line
      const lash = new THREE.Mesh(new THREE.TorusGeometry(r * (isFemale ? 0.165 : 0.145), r * (isFemale ? 0.024 : 0.018), 6, 12, Math.PI * 0.85), lashMat);
      lash.rotation.z = Math.PI * 0.08;
      lash.position.set(0, r * 0.01, r * 0.035);
      eyeGroup.add(lash);

      // Eyebrow cleanly above eye
      const brow = new THREE.Mesh(new THREE.BoxGeometry(r * 0.34, r * (isFemale ? 0.042 : 0.058), r * 0.04), browMat);
      brow.position.set(0, r * 0.22, r * 0.02);
      brow.rotation.z = -side * (isFemale ? 0.08 : 0.04);
      eyeGroup.add(brow);

      g.add(eyeGroup);

      if (isFemale) {
        const blush = new THREE.Mesh(new THREE.CircleGeometry(r * 0.14, 12), blushMat);
        blush.position.set(side * r * 0.45, -r * 0.14, r * 0.83);
        blush.rotation.y = side * 0.36;
        g.add(blush);
      }
    });

    // Subtle sculpted 3D Nose on +Z
    const nose = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.28, 6), headSkinMat);
    nose.rotation.x = Math.PI / 2 - 0.25;
    nose.position.set(0, -r * 0.1, r * 0.96);
    g.add(nose);

    // Subtle Lips on +Z
    const lips = new THREE.Mesh(new THREE.SphereGeometry(r * 0.15, 10, 8), lipMat);
    lips.scale.set(1.25, 0.35, 0.45);
    lips.position.set(0, -r * 0.38, r * 0.86);
    g.add(lips);

    return g;
  }

  // Smooth Gap-Free Hair Cap Helper (No spikes! Clean hairline strictly ABOVE eyes & eyebrows!)
  function addFullHairCap(headGroup, r, hairMat, style) {
    // 1) Smooth upper crown dome tilted slightly backward so front hairline sits cleanly on upper forehead (above brows!)
    const crown = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.44), hairMat);
    crown.scale.set(0.95, 1.1, 1.0);
    crown.rotation.x = -0.22;
    headGroup.add(crown);

    // 2) Full smooth rear skull & nape shell covering entire back hemisphere (-Z) with zero gaps
    const backShell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 22, 16, Math.PI * 0.04, Math.PI * 0.92, Math.PI * 0.14, Math.PI * 0.7), hairMat);
    backShell.scale.set(0.96, 1.08, 1.02);
    backShell.rotation.y = Math.PI;
    headGroup.add(backShell);

    // 3) Smooth flush side hair framing temples (behind cheekbones, never sticking out)
    [-1, 1].forEach(function (side) {
      const sideLock = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.13, r * (style === "long" ? 2.2 : 0.68), 10), hairMat);
      sideLock.position.set(side * r * 0.84, style === "long" ? -r * 0.82 : -r * 0.12, -r * 0.02);
      sideLock.rotation.z = side * 0.06;
      headGroup.add(sideLock);
    });

    // 4) Smooth flush swept forehead fringe (curved sphere band hugging scalp, zero protruding cones!)
    const fringe = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.08, 16, 8, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.24, Math.PI * 0.14),
      hairMat
    );
    fringe.scale.set(0.95, 1.08, 1.0);
    fringe.rotation.y = 0; // Front (+Z) upper forehead only, cleanly above eyebrows!
    headGroup.add(fringe);

    if (style === "bun") {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(r * 0.52, 14, 12), hairMat);
      bun.position.set(0, r * 0.08, -r * 1.12);
      headGroup.add(bun);
    } else if (style === "long") {
      const backCurtain = makeLathe([[r * 1.22, 0], [r * 1.12, r * 1.6], [r * 0.94, r * 3.1], [r * 0.45, r * 3.8]], 16, hairMat);
      backCurtain.position.set(0, -r * 3.4, -r * 0.5);
      headGroup.add(backCurtain);
    }
  }

  // Detailed Medieval Longsword
  function createLongsword() {
    const sword = new THREE.Group();
    const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.042), goldMat);
    pommel.position.y = -0.23;
    sword.add(pommel);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, 0.21, 10), leatherMat);
    grip.position.y = -0.105;
    sword.add(grip);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.032, 0.042), goldMat);
    guard.position.y = 0.015;
    sword.add(guard);
    [-0.17, 0.17].forEach(function (gx) {
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), goldMat);
      tip.position.set(gx, 0.024, 0);
      sword.add(tip);
    });
    const bladeGeo = new THREE.CylinderGeometry(0.012, 0.046, 0.94, 4);
    bladeGeo.scale(1.0, 1.0, 0.24);
    const blade = new THREE.Mesh(bladeGeo, steelBladeMat);
    blade.rotation.y = Math.PI / 4;
    blade.position.y = 0.5;
    sword.add(blade);
    const pointGeo = new THREE.ConeGeometry(0.022, 0.17, 4);
    pointGeo.scale(1.0, 1.0, 0.32);
    const point = new THREE.Mesh(pointGeo, steelBladeMat);
    point.rotation.y = Math.PI / 4;
    point.position.y = 1.05;
    sword.add(point);
    return sword;
  }

  // Detailed Medieval Winged Spear with Royal Pennant
  function createSpear() {
    const spear = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, 2.74, 10), darkWoodMat);
    shaft.position.y = 1.37;
    spear.add(shaft);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.027, 0.16, 10), goldMat);
    collar.position.y = 2.68;
    spear.add(collar);
    const headGeo = new THREE.ConeGeometry(0.068, 0.48, 4);
    headGeo.scale(1.0, 1.0, 0.3);
    const head = new THREE.Mesh(headGeo, steelBladeMat);
    head.rotation.y = Math.PI / 4;
    head.position.y = 2.99;
    spear.add(head);
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.024, 0.028), goldMat);
    lug.position.y = 2.75;
    spear.add(lug);
    const pennantShape = new THREE.Shape();
    pennantShape.moveTo(0, 0); pennantShape.lineTo(0.3, -0.06); pennantShape.lineTo(0.23, -0.19); pennantShape.lineTo(0.3, -0.34); pennantShape.lineTo(0, -0.25); pennantShape.closePath();
    const pennant = new THREE.Mesh(new THREE.ShapeGeometry(pennantShape), sharedPennantMat);
    pennant.position.set(0.024, 2.64, 0);
    spear.add(pennant);
    return spear;
  }

  // --- PROTAGONIST (+Z forward: Clean Face, Full Hair, Sleek Hoodie & Scabbarded Hip Sword) ---
  function createHero() {
    const root = new THREE.Group();
    addContactShadow(root, 0.36);

    // Dedicated 512x512 UV-mapped Hoodie Texture (u=0.5 / x=256 is +Z front after rotation.y=Math.PI)
    function createHoodieTorsoTexture() {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 512;
      const g = c.getContext("2d");

      // Charcoal-grey sweatshirt fleece base with subtle vertical shading
      const bg = g.createLinearGradient(0, 0, 0, 512);
      bg.addColorStop(0, "#434854");
      bg.addColorStop(0.55, "#383d47");
      bg.addColorStop(0.88, "#313640");
      bg.addColorStop(0.9, "#252932"); // Ribbed waist band at bottom
      bg.addColorStop(1, "#22262e");
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 512);

      // Subtle cloth micro-grain
      for (let i = 0; i < 2400; i++) {
        g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)";
        g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }

      // Ribbing lines on waist band (y: 458..512)
      g.strokeStyle = "rgba(0,0,0,0.22)";
      g.lineWidth = 2;
      for (let x = 0; x < 512; x += 8) {
        g.beginPath(); g.moveTo(x, 458); g.lineTo(x, 512); g.stroke();
      }

      // --- FRONT (+Z, centered at x = 256) ---
      // 1) Open V-neckline revealing white crew-neck T-shirt & natural collarbone skin
      g.fillStyle = "#e8ecf4"; // Inner white T-shirt
      g.beginPath();
      g.moveTo(208, 0);
      g.lineTo(304, 0);
      g.quadraticCurveTo(286, 108, 256, 134);
      g.quadraticCurveTo(226, 108, 208, 0);
      g.closePath();
      g.fill();

      // Crew-neck skin opening at very top of V
      g.fillStyle = "#edc09e";
      g.beginPath();
      g.moveTo(224, 0);
      g.lineTo(288, 0);
      g.quadraticCurveTo(276, 52, 256, 62);
      g.quadraticCurveTo(236, 52, 224, 0);
      g.closePath();
      g.fill();

      // White T-shirt collar rib
      g.strokeStyle = "#cfd6e3";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(224, 2);
      g.quadraticCurveTo(256, 74, 288, 2);
      g.stroke();

      // Open hoodie V-collar edge shadow & seam
      g.strokeStyle = "#20242c";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(208, 0);
      g.quadraticCurveTo(226, 108, 256, 134);
      g.quadraticCurveTo(286, 108, 304, 0);
      g.stroke();

      // 2) Clean front center zipper running from V-point (y=134) down to waist hem
      g.fillStyle = "#232730";
      g.fillRect(252, 134, 8, 378);
      g.strokeStyle = "#9aa4b4";
      g.lineWidth = 2;
      g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(256, 136); g.lineTo(256, 506); g.stroke();
      g.setLineDash([]);

      // 3) Metal grommets & natural draped white hoodie drawstrings
      [-1, 1].forEach(function (side) {
        const gx = 256 + side * 26;
        g.fillStyle = "#aeb7c6";
        g.beginPath(); g.arc(gx, 96, 4.5, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "#e6eaf2";
        g.lineWidth = 3.5;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(gx, 98);
        g.quadraticCurveTo(gx + side * 4, 152, gx + side * 2, 198);
        g.stroke();
        // Aglet tip
        g.fillStyle = "#8f99a8";
        g.fillRect(gx + side * 2 - 2, 196, 4, 9);
      });

      // 4) Split Kangaroo Front Pockets (subtle stitched seams & shadow)
      [-1, 1].forEach(function (side) {
        g.fillStyle = "rgba(18, 22, 28, 0.22)";
        g.beginPath();
        g.moveTo(256 + side * 8, 336);
        g.lineTo(256 + side * 66, 336);
        g.lineTo(256 + side * 82, 405);
        g.lineTo(256 + side * 82, 456);
        g.lineTo(256 + side * 8, 456);
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(16, 19, 24, 0.55)";
        g.lineWidth = 2.5;
        g.stroke();
      });

      return new THREE.CanvasTexture(c);
    }

    const hoodieTorsoMat = new THREE.MeshStandardMaterial({
      map: createHoodieTorsoTexture(),
      roughness: 0.85, transparent: true, opacity: 1.0
    });
    const hoodieMat = new THREE.MeshStandardMaterial({
      map: createFabricTexture("#383d47", "#242830", "plain"),
      roughness: 0.85, transparent: true, opacity: 1.0
    });
    const hoodieRibMat = new THREE.MeshStandardMaterial({ color: 0x242831, roughness: 0.88, transparent: true, opacity: 1.0 });
    const innerTeeMat = new THREE.MeshStandardMaterial({ color: 0xe6eaf2, roughness: 0.82, transparent: true, opacity: 1.0 });
    const jeansMat = new THREE.MeshStandardMaterial({
      map: createFabricTexture("#273b59", "#1a283d", "plain"),
      roughness: 0.82, transparent: true, opacity: 1.0
    });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1e2128, roughness: 0.6 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xe8ebf2, roughness: 0.78 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x251811, roughness: 0.68 });

    // Upper body pivot (Faces +Z!)
    const upperBody = new THREE.Group();
    upperBody.position.y = 0.94;
    root.add(upperBody);

    // Clean UV-mapped Hoodie Torso (rotation.y = Math.PI maps u=0.5 front V-neck/zipper/pockets dead-center onto +Z!)
    const torso = makeLathe([
      [0.172, 0], [0.18, 0.07], [0.176, 0.24], [0.198, 0.44],
      [0.212, 0.55], [0.172, 0.625], [0.075, 0.66]
    ], 24, hoodieTorsoMat);
    torso.scale.set(1.06, 1.0, 0.68);
    torso.rotation.y = Math.PI;
    upperBody.add(torso);

    // BACK (-Z): Tailored flat folded hood collar sitting neatly at the nape (no bulging hump!)
    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.028, 10, 18, Math.PI * 1.15), hoodieRibMat);
    hoodCollar.rotation.x = Math.PI / 2 - 0.18;
    hoodCollar.rotation.z = Math.PI - Math.PI * 0.075;
    hoodCollar.position.set(0, 0.625, -0.028);
    upperBody.add(hoodCollar);
    const hoodFold = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.11, 14, 1, false, Math.PI * 0.65, Math.PI * 0.7), hoodieRibMat);
    hoodFold.scale.set(1.12, 1, 0.78);
    hoodFold.position.set(0, 0.56, -0.068);
    upperBody.add(hoodFold);

    // Glowing Translation Collar around neck
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, emissive: 0x38bdf8, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.85 });
    const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.015, 8, 20), collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.675, 0);
    upperBody.add(collarMesh);

    // Neat Leather Scabbard + Sword Hilt at left hip (+X side when facing +Z)
    const scabbardGroup = new THREE.Group();
    const scabbard = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.72, 8), leatherMat);
    scabbard.position.y = -0.34;
    scabbardGroup.add(scabbard);
    const scabbardHilt = new THREE.Group();
    const hiltGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.028), goldMat);
    scabbardHilt.add(hiltGuard);
    const hiltGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.016, 0.14, 8), leatherMat);
    hiltGrip.position.y = 0.08;
    scabbardHilt.add(hiltGrip);
    const hiltPommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.026), goldMat);
    hiltPommel.position.y = 0.16;
    scabbardHilt.add(hiltPommel);
    scabbardGroup.add(scabbardHilt);
    scabbardGroup.position.set(0.21, 0.06, -0.02);
    scabbardGroup.rotation.x = 0.52;
    scabbardGroup.rotation.z = 0.18;
    upperBody.add(scabbardGroup);

    // Head Pivot (Faces +Z!)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.665, 0);
    upperBody.add(headPivot);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.11, 12), skinMat);
    neck.position.y = 0.045;
    headPivot.add(neck);

    const headCore = createHumanHead({ radius: 0.128, skinColor: 0xf0c4a2, irisColor: 0x2c241e, browColor: 0x251811, female: false });
    headCore.position.y = 0.2;
    addFullHairCap(headCore, 0.128, hairMat, "short");
    headPivot.add(headCore);

    // Articulated Arms with REAL Shoulder -> Elbow -> Forearm/Hand Joint Hierarchy!
    function makeArm(side) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.208, 0.545, 0);
      shoulderPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), hoodieMat));

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.27, 12), hoodieMat);
      upperArm.position.set(side * 0.01, -0.135, 0);
      shoulderPivot.add(upperArm);

      // True Elbow Pivot!
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(side * 0.012, -0.27, 0);
      elbowPivot.rotation.x = -0.16; // Natural relaxed bend forward (+Z)
      shoulderPivot.add(elbowPivot);

      elbowPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.051, 10, 10), hoodieMat));
      const foreArm = new THREE.Mesh(new THREE.CylinderGeometry(0.051, 0.04, 0.25, 12), hoodieMat);
      foreArm.position.y = -0.125;
      elbowPivot.add(foreArm);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.038, 0.036, 10), hoodieRibMat);
      cuff.position.y = -0.255;
      elbowPivot.add(cuff);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), skinMat);
      hand.scale.set(0.82, 1.15, 0.65);
      hand.position.y = -0.305;
      elbowPivot.add(hand);

      upperBody.add(shoulderPivot);
      return { shoulder: shoulderPivot, elbow: elbowPivot };
    }
    const leftArm = makeArm(1);
    const rightArm = makeArm(-1);

    // Drawn longsword in Hero's right hand (hidden until draw-sword animation!)
    const drawnSword = createLongsword();
    drawnSword.scale.set(0.84, 0.84, 0.84);
    drawnSword.position.set(0, -0.31, 0.04);
    drawnSword.rotation.x = Math.PI / 2 - 0.15;
    drawnSword.visible = false;
    rightArm.elbow.add(drawnSword);

    // Smooth Pelvis + Articulated Legs with REAL Hip -> Knee -> Calf/Foot Joint Hierarchy!
    const hips = makeLathe([[0.172, 0], [0.18, 0.07], [0.175, 0.14]], 18, jeansMat);
    hips.scale.set(1.04, 1, 0.68);
    hips.position.y = 0.82;
    root.add(hips);

    function makeLeg(side) {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.102, 0.88, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.07, 0.42, 14), jeansMat);
      thigh.position.y = -0.21;
      hipPivot.add(thigh);

      // True Knee Pivot!
      const kneePivot = new THREE.Group();
      kneePivot.position.y = -0.42;
      hipPivot.add(kneePivot);

      kneePivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), jeansMat));
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.054, 0.39, 14), jeansMat);
      calf.position.y = -0.195;
      kneePivot.add(calf);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.066, 0.21), shoeMat);
      shoe.position.set(0, -0.4, 0.038);
      kneePivot.add(shoe);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), shoeMat);
      toe.scale.set(1, 0.65, 1.05);
      toe.position.set(0, -0.415, 0.128);
      kneePivot.add(toe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.024, 0.25), soleMat);
      sole.position.set(0, -0.444, 0.045);
      kneePivot.add(sole);

      root.add(hipPivot);
      return { hip: hipPivot, knee: kneePivot };
    }
    const leftLeg = makeLeg(1);
    const rightLeg = makeLeg(-1);

    return {
      group: root, upperBody: upperBody, headPivot: headPivot,
      leftArm: leftArm, rightArm: rightArm, leftLeg: leftLeg, rightLeg: rightLeg,
      collarMesh: collarMesh, collarMat: collarMat,
      drawnSword: drawnSword, scabbardHilt: scabbardHilt,
      fadeMats: [hoodieTorsoMat, hoodieMat, hoodieRibMat, innerTeeMat, jeansMat]
    };
  }

  // --- REALISTIC SEATED KING (+Z forward) ---
  function createKing() {
    const root = new THREE.Group();
    const robeMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#8f1620", "#e6b647", "royal"), roughness: 0.66, side: THREE.DoubleSide });
    const ermineMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#f4efe6", "#222", "ermine"), roughness: 0.88 });
    const doubletMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#3b2318", "#e6b647", "royal"), roughness: 0.7 });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xeaeef6, roughness: 0.76 });

    [-0.22, 0.22].forEach(function (kx) {
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.08, 0.56, 12), leatherMat);
      shin.position.set(kx, 0.42, 0.48);
      root.add(shin);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), leatherMat);
      boot.position.set(kx, 0.14, 0.54);
      root.add(boot);
    });

    const lapRobe = makeLathe([[0.54, 0.12], [0.52, 0.42], [0.46, 0.74], [0.36, 0.9]], 18, robeMat);
    lapRobe.position.set(0, 0.06, 0.14);
    root.add(lapRobe);

    const torso = makeLathe([[0.24, 0], [0.27, 0.25], [0.33, 0.52], [0.28, 0.68], [0.12, 0.74]], 18, doubletMat);
    torso.scale.set(1.12, 1, 0.78);
    torso.position.set(0, 0.86, -0.02);
    root.add(torso);

    const cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.58, 1.05, 18, 1, true, Math.PI * 0.24, Math.PI * 1.52), robeMat);
    cloak.position.set(0, 1.08, -0.06);
    root.add(cloak);

    const ermineCape = makeLathe([[0.45, 0], [0.4, 0.14], [0.28, 0.24], [0.14, 0.28]], 18, ermineMat);
    ermineCape.scale.set(1.1, 1, 0.85);
    ermineCape.position.set(0, 1.38, -0.03);
    root.add(ermineCape);

    const chainRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 18, Math.PI), goldMat);
    chainRing.rotation.z = Math.PI;
    chainRing.position.set(0, 1.44, 0.2);
    root.add(chainRing);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.62, 0.02);
    root.add(headPivot);

    const headCore = createHumanHead({ radius: 0.155, skinColor: 0xe9bc99, irisColor: 0x3b5878, browColor: 0xe6eaf2, female: false });
    headCore.position.y = 0.22;
    addFullHairCap(headCore, 0.155, beardMat, "short");
    headPivot.add(headCore);

    // Mustache & Full Royal Beard on +Z
    [-1, 1].forEach(function (side) {
      const stache = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.13, 8), beardMat);
      stache.rotation.z = side * 1.22;
      stache.position.set(side * 0.052, 0.165, 0.15);
      headPivot.add(stache);
    });
    const mainBeard = makeLathe([[0.015, 0], [0.088, 0.08], [0.138, 0.22], [0.12, 0.3]], 14, beardMat);
    mainBeard.scale.set(1, 1, 0.65);
    mainBeard.position.set(0, -0.12, 0.1);
    headPivot.add(mainBeard);

    // Imperial Crown sitting cleanly on top of silver hair
    const crownCap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), velvetRedMat);
    crownCap.position.y = 0.36;
    headPivot.add(crownCap);
    const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.156, 0.095, 16), goldMat);
    crownBand.position.y = 0.38;
    headPivot.add(crownBand);
    [0, Math.PI / 2].forEach(function (ry) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.016, 6, 16, Math.PI), goldMat);
      arch.rotation.y = ry;
      arch.position.y = 0.42;
      headPivot.add(arch);
    });

    function makeKingArm(side) {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.4, 1.48, 0.02);
      armPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 12), robeMat));
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.075, 0.54, 12), robeMat);
      sleeve.position.y = -0.26;
      armPivot.add(sleeve);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.024, 8, 12), ermineMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.52;
      armPivot.add(cuff);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 10), skinMat);
      hand.position.y = -0.57;
      armPivot.add(hand);
      root.add(armPivot);
      return armPivot;
    }
    const rightArm = makeKingArm(-1);
    const leftArm = makeKingArm(1);
    leftArm.rotation.x = -0.55;

    root.position.set(0, daisY + 0.05, -7.12);
    scene.add(root);
    return { group: root, headPivot: headPivot, rightArm: rightArm };
  }

  // --- REALISTIC ROYAL LADY (Queen & Princess, +Z forward) ---
  function createRoyalLady(opts) {
    const root = new THREE.Group();
    const s = opts.scale || 1.0;
    addContactShadow(root, 0.42 * s);

    const dressMat = new THREE.MeshStandardMaterial({ map: createFabricTexture(opts.dressHex, "#f0c96a", "royal"), roughness: 0.62 });
    const trimSilkMat = new THREE.MeshStandardMaterial({ color: opts.accentColor || 0xf3e8d2, roughness: 0.55 });
    const hairMat = new THREE.MeshStandardMaterial({ color: opts.hairColor, roughness: 0.58 });

    const gown = makeLathe([
      [0.48 * s, 0], [0.44 * s, 0.24 * s], [0.35 * s, 0.56 * s], [0.23 * s, 0.84 * s],
      [0.128 * s, 0.99 * s], [0.16 * s, 1.15 * s], [0.17 * s, 1.29 * s], [0.1 * s, 1.36 * s]
    ], 24, dressMat);
    root.add(gown);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.138 * s, 0.019 * s, 8, 20), goldMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 0.99 * s;
    root.add(sash);

    const laceCollar = new THREE.Mesh(new THREE.TorusGeometry(0.108 * s, 0.016 * s, 8, 18), trimSilkMat);
    laceCollar.rotation.x = Math.PI / 2;
    laceCollar.position.y = 1.34 * s;
    root.add(laceCollar);

    [-1, 1].forEach(function (side) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.088 * s, 12, 12), dressMat);
      puff.position.set(side * 0.195 * s, 1.28 * s, 0);
      root.add(puff);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.034 * s, 0.24 * s, 10), dressMat);
      upper.position.set(side * 0.2 * s, 1.14 * s, 0.02 * s);
      upper.rotation.z = side * 0.1;
      root.add(upper);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.033 * s, 0.026 * s, 0.24 * s, 10), skinMat);
      fore.position.set(side * 0.145 * s, 0.98 * s, 0.12 * s);
      fore.rotation.x = -0.82;
      fore.rotation.z = -side * 0.42;
      root.add(fore);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 8, 8), skinMat);
      hand.position.set(side * 0.06 * s, 0.93 * s, 0.2 * s);
      root.add(hand);
    });

    // Upper collarbone/chest & clearly visible contoured neck anchoring head solidly to bodice
    const ladySkinMat = new THREE.MeshStandardMaterial({ color: 0xf6d3ba, roughness: 0.54 });
    const chestSkin = new THREE.Mesh(new THREE.SphereGeometry(0.125 * s, 14, 12), ladySkinMat);
    chestSkin.scale.set(1.18, 0.55, 0.85);
    chestSkin.position.y = 1.325 * s;
    root.add(chestSkin);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056 * s, 0.068 * s, 0.22 * s, 14), ladySkinMat);
    neck.position.y = 1.405 * s;
    root.add(neck);

    const headCore = createHumanHead({ radius: 0.126 * s, skinColor: 0xf6d3ba, irisColor: opts.eyeInt || 0x386896, browColor: opts.hairColor, female: true });
    headCore.position.y = 1.52 * s;
    addFullHairCap(headCore, 0.126 * s, hairMat, "long");
    root.add(headCore);

    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.112 * s, 0.014 * s, 8, 16, Math.PI), goldMat);
    tiara.position.set(0, 1.64 * s, 0.03 * s);
    tiara.rotation.x = -0.25;
    root.add(tiara);

    root.position.set(opts.x, opts.y, opts.z);
    root.rotation.y = opts.rotY || 0;
    scene.add(root);
    return root;
  }

  // --- DEDICATED REALISTIC MEDIEVAL MAID (+Z forward, Flush Apron, Clean Hair & Face!) ---
  function createMaid(x, y, z, rotY) {
    const root = new THREE.Group();
    addContactShadow(root, 0.38);

    const maidDressMat = new THREE.MeshStandardMaterial({ map: createFabricTexture("#273142", "#1a202c", "plain"), roughness: 0.78 });
    const whiteLinenMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x483022, roughness: 0.64 });

    [-0.095, 0.095].forEach(function (sx) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.058, 0.17), leatherMat);
      shoe.position.set(sx, 0.03, 0.04);
      root.add(shoe);
    });

    // Pleated skirt with crisp white lace hem
    const petticoat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.085, 22), whiteLinenMat);
    petticoat.position.y = 0.08;
    root.add(petticoat);
    const skirt = makeLathe([[0.4, 0.08], [0.37, 0.28], [0.29, 0.58], [0.19, 0.84], [0.128, 0.96]], 24, maidDressMat);
    root.add(skirt);

    // Fitted bodice
    const bodice = makeLathe([[0.128, 0.95], [0.155, 1.12], [0.164, 1.26], [0.102, 1.33]], 20, maidDressMat);
    root.add(bodice);

    // Flush-fitted curved White Apron Skirt (follows skirt lathe profile cleanly — zero floating/clipping!)
    const apronPts = [[0.408, 0.16], [0.365, 0.34], [0.285, 0.6], [0.195, 0.84], [0.136, 0.96]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    const apronGeo = new THREE.LatheGeometry(apronPts, 18, -0.78, 1.56);
    const apronSkirt = new THREE.Mesh(apronGeo, whiteLinenMat);
    root.add(apronSkirt);

    // Flush White Apron Bib (curved cylinder arc hugging chest)
    const bib = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.136, 0.28, 14, 1, false, -0.58, 1.16), whiteLinenMat);
    bib.position.y = 1.11;
    root.add(bib);

    const waistTie = new THREE.Mesh(new THREE.TorusGeometry(0.134, 0.018, 8, 20), whiteLinenMat);
    waistTie.rotation.x = Math.PI / 2;
    waistTie.position.y = 0.96;
    root.add(waistTie);

    // Back Apron Bow on -Z
    [-1, 1].forEach(function (side) {
      const bow = new THREE.Mesh(new THREE.SphereGeometry(0.064, 10, 8), whiteLinenMat);
      bow.scale.set(1.25, 0.7, 0.42);
      bow.position.set(side * 0.07, 0.96, -0.155);
      bow.rotation.z = side * 0.25;
      root.add(bow);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.2, 0.014), whiteLinenMat);
      tail.position.set(side * 0.042, 0.84, -0.16);
      tail.rotation.z = side * 0.15;
      root.add(tail);
    });

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.02, 8, 18), whiteLinenMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.32;
    root.add(collar);

    // Puffed white shoulders, fitted sleeves, white cuffs & clasped hands
    [-1, 1].forEach(function (side) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), whiteLinenMat);
      puff.position.set(side * 0.188, 1.25, 0);
      root.add(puff);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.03, 0.35, 10), maidDressMat);
      fore.position.set(side * 0.182, 1.04, 0.075);
      fore.rotation.x = -0.58;
      fore.rotation.z = -side * 0.22;
      root.add(fore);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.011, 6, 12), whiteLinenMat);
      cuff.rotation.x = Math.PI / 2 - 0.58;
      cuff.position.set(side * 0.135, 0.93, 0.165);
      root.add(cuff);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
      hand.position.set(side * 0.102, 0.91, 0.2);
      root.add(hand);
    });

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.11, 12), skinMat);
    neck.position.y = 1.37;
    root.add(neck);

    // Clean Realistic Face + Full Gap-Free Hair with Chignon Bun + White Maid Headband!
    const headCore = createHumanHead({ radius: 0.122, skinColor: 0xf5cfb4, irisColor: 0x3b6e58, browColor: 0x483022, female: true });
    headCore.position.y = 1.51;
    addFullHairCap(headCore, 0.122, hairMat, "bun");
    root.add(headCore);

    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.136, 0.015, 8, 18, Math.PI), whiteLinenMat);
    headband.position.set(0, 1.54, 0.012);
    headband.rotation.x = -0.18;
    root.add(headband);
    for (let i = -3; i <= 3; i++) {
      const ang = (i / 3.4) * (Math.PI / 2);
      const frill = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), whiteLinenMat);
      frill.position.set(Math.sin(ang) * 0.144, 1.55 + Math.cos(ang) * 0.14, 0.02);
      root.add(frill);
    }

    root.position.set(x, y, z);
    root.rotation.y = rotY || 0;
    scene.add(root);
    return root;
  }

  // --- GOTHIC PLATE ARMOR SWORD KNIGHT (+Z forward, Sword + Heraldic Shield) ---
  function createSwordKnight(x, y, z, rotY, swordSide) {
    const root = new THREE.Group();
    const sSide = swordSide || 1;
    addContactShadow(root, 0.42);

    [-0.122, 0.122].forEach(function (lx) {
      const cuisse = makeLathe([[0.078, 0], [0.09, 0.2], [0.096, 0.4]], 14, armorMat);
      cuisse.position.set(lx, 0.47, 0);
      root.add(cuisse);
      const poleyn = new THREE.Mesh(new THREE.SphereGeometry(0.086, 12, 10), armorMat);
      poleyn.position.set(lx, 0.46, 0.022);
      root.add(poleyn);
      const greave = makeLathe([[0.058, 0], [0.07, 0.16], [0.082, 0.3], [0.074, 0.41]], 14, armorMat);
      greave.position.set(lx, 0.06, 0);
      root.add(greave);
      const sabaton = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.066, 0.23), armorMat);
      sabaton.position.set(lx, 0.036, 0.045);
      root.add(sabaton);
    });

    const mailSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.255, 0.3, 16), darkArmorMat);
    mailSkirt.position.y = 0.84;
    root.add(mailSkirt);
    [0.92, 0.86, 0.8].forEach(function (fy, idx) {
      const lame = new THREE.Mesh(new THREE.TorusGeometry(0.2 + idx * 0.016, 0.026, 6, 16), armorMat);
      lame.scale.set(1.06, 0.84, 1);
      lame.rotation.x = Math.PI / 2;
      lame.position.y = fy;
      root.add(lame);
    });
    [-0.135, 0.135].forEach(function (tx) {
      const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.24, 0.03), armorMat);
      tasset.position.set(tx, 0.72, 0.19);
      tasset.rotation.x = -0.16;
      root.add(tasset);
    });

    const cuirass = makeLathe([[0.185, 0], [0.215, 0.16], [0.272, 0.38], [0.25, 0.56], [0.132, 0.64]], 18, armorMat);
    cuirass.scale.set(1.06, 1, 0.84);
    cuirass.position.y = 0.94;
    root.add(cuirass);
    const tapul = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.44, 0.052), goldMat);
    tapul.position.set(0, 1.24, 0.218);
    root.add(tapul);

    const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 1.28, 12, 1, true, Math.PI * 0.65, Math.PI * 0.7), sharedCapeMat);
    cape.position.set(0, 0.9, -0.05);
    root.add(cape);

    [-1, 1].forEach(function (side) {
      [0, 1, 2].forEach(function (tier) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.145 - tier * 0.014, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), armorMat);
        p.position.set(side * (0.295 + tier * 0.02), 1.49 - tier * 0.062, 0);
        p.rotation.z = -side * (0.3 + tier * 0.12);
        root.add(p);
      });
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.32, 1.44, 0);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.064, 0.28, 12), armorMat);
      upper.position.y = -0.14;
      armGroup.add(upper);
      const vambrace = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.052, 0.26, 12), armorMat);
      vambrace.position.set(0, -0.4, 0.06);
      vambrace.rotation.x = -0.35;
      armGroup.add(vambrace);
      const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.105, 0.09), darkPlateMat);
      gauntlet.position.set(0, -0.54, 0.115);
      armGroup.add(gauntlet);

      if (side === sSide) {
        armGroup.rotation.x = -0.78;
        armGroup.rotation.z = -side * 0.12;
        const sword = createLongsword();
        sword.position.set(0, -0.52, 0.14);
        sword.rotation.x = 0.78;
        sword.rotation.y = side * 0.15;
        armGroup.add(sword);
      } else {
        armGroup.rotation.x = -0.25;
        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(-0.21, 0.27); shieldShape.lineTo(0.21, 0.27);
        shieldShape.lineTo(0.21, -0.02); shieldShape.quadraticCurveTo(0.17, -0.23, 0, -0.33);
        shieldShape.quadraticCurveTo(-0.17, -0.23, -0.21, -0.02); shieldShape.closePath();
        const shield = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape, { depth: 0.03, bevelEnabled: false }), sharedCapeMat);
        shield.position.set(side * 0.08, -0.42, 0.12);
        shield.rotation.y = side * 0.52;
        armGroup.add(shield);
        const sBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), goldMat);
        sBoss.position.set(side * 0.1, -0.38, 0.155);
        armGroup.add(sBoss);
      }
      root.add(armGroup);
    });

    // Armet Helmet facing +Z
    const gorget = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.17, 0.13, 16), armorMat);
    gorget.position.y = 1.59;
    root.add(gorget);
    const helmDome = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 16), armorMat);
    helmDome.scale.set(0.94, 1.08, 1.06);
    helmDome.position.y = 1.77;
    root.add(helmDome);
    const visor = new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.185, 4), armorMat);
    visor.rotation.x = Math.PI / 2;
    visor.rotation.z = Math.PI / 4;
    visor.position.set(0, 1.75, 0.135);
    root.add(visor);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.022, 0.12), ironMat);
    slit.position.set(0, 1.78, 0.165);
    root.add(slit);
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.02, 8, 16, Math.PI), goldMat);
    crest.rotation.y = Math.PI / 2;
    crest.position.set(0, 1.82, 0);
    root.add(crest);
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.26, 8), sharedPennantMat);
    plume.rotation.x = -2.1;
    plume.position.set(0, 1.92, -0.14);
    root.add(plume);

    root.position.set(x, y, z);
    root.rotation.y = rotY;
    scene.add(root);
    return root;
  }

  // --- REALISTIC INFANTRY SPEARMAN (+Z forward, Clean Face Facing +Z under Kettle Helmet!) ---
  function createSpearman(x, z, rotY, spearSide) {
    const root = new THREE.Group();
    const sSide = spearSide || 1;
    addContactShadow(root, 0.38);

    [-0.118, 0.118].forEach(function (lx) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.07, 0.48, 12), darkArmorMat);
      leg.position.set(lx, 0.66, 0);
      root.add(leg);
      const shin = makeLathe([[0.056, 0], [0.07, 0.2], [0.076, 0.4]], 12, armorMat);
      shin.position.set(lx, 0.06, 0);
      root.add(shin);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.068, 0.21), leatherMat);
      boot.position.set(lx, 0.036, 0.04);
      root.add(boot);
    });

    const surcoat = makeLathe([[0.285, 0], [0.245, 0.24], [0.205, 0.42], [0.245, 0.68], [0.235, 0.88], [0.128, 0.96]], 16, sharedSurcoatMat);
    surcoat.scale.set(1.04, 1, 0.82);
    surcoat.position.y = 0.64;
    root.add(surcoat);

    const plate = makeLathe([[0.198, 0], [0.228, 0.18], [0.238, 0.36], [0.148, 0.44]], 16, armorMat);
    plate.scale.set(1.06, 1, 0.86);
    plate.position.y = 1.08;
    root.add(plate);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.062, 16), leatherMat);
    belt.scale.set(1.05, 1, 0.86);
    belt.position.y = 1.02;
    root.add(belt);

    [-1, 1].forEach(function (side) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.118, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), armorMat);
      pauldron.position.set(side * 0.275, 1.47, 0);
      pauldron.rotation.z = -side * 0.3;
      root.add(pauldron);
      const arm = new THREE.Group();
      arm.position.set(side * 0.285, 1.42, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.052, 0.48, 10), darkArmorMat);
      sleeve.position.y = -0.24;
      arm.add(sleeve);
      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10), armorMat);
      bracer.position.y = -0.38;
      arm.add(bracer);
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), leatherMat);
      glove.position.y = -0.52;
      arm.add(glove);
      if (side === sSide) arm.rotation.x = -0.68;
      root.add(arm);
    });

    // Clean Soldier Face strictly facing +Z under Kettle Helmet + Coif
    const headCore = createHumanHead({ radius: 0.125, skinColor: 0xe6b896, irisColor: 0x352e26, browColor: 0x38281e, female: false });
    headCore.position.y = 1.72;
    root.add(headCore);

    const coif = new THREE.Mesh(new THREE.SphereGeometry(0.132, 14, 12, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.18, Math.PI * 0.72), darkArmorMat);
    coif.rotation.y = Math.PI;
    coif.position.y = 1.71;
    root.add(coif);

    const helmTop = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.54), armorMat);
    helmTop.position.y = 1.77;
    root.add(helmTop);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.146, 0.225, 0.055, 18), armorMat);
    brim.position.y = 1.78;
    root.add(brim);

    const spear = createSpear();
    spear.position.set(sSide * 0.31, 0, 0.34);
    root.add(spear);

    root.position.set(x, 0, z);
    root.rotation.y = rotY;
    scene.add(root);
    return root;
  }

  // Instantiate Scene Characters (All use +Z forward!)
  const hero = createHero();
  scene.add(hero.group);

  const king = createKing();
  const queen = createRoyalLady({ x: -1.78, y: daisY, z: -6.18, rotY: 0.22, dressHex: "#663682", accentColor: 0x9b6bb8, hairColor: 0x382217, eyeInt: 0x5a3d7a, scale: 1.03 });
  const princess = createRoyalLady({ x: 1.78, y: daisY, z: -6.02, rotY: -0.22, dressHex: "#6fb2e6", accentColor: 0xc2e2fc, hairColor: 0xe6c165, eyeInt: 0x2d78b8, scale: 0.93 });

  // Dais & Aisle Gothic Sword Knights
  createSwordKnight(-2.55, daisY, -7.15, 0.16, 1);
  createSwordKnight(2.55, daisY, -7.15, -0.16, -1);
  [-1.0, 1.7, 4.4].forEach(function (gz) {
    createSwordKnight(-1.95, 0, gz, Math.PI / 2 - 0.22, 1);
    createSwordKnight(1.95, 0, gz, -Math.PI / 2 + 0.22, -1);
  });

  // Rear Spearmen (槍兵) in Throne Room
  const spearmen = [
    createSpearman(-3.9, -0.2, Math.PI / 2 - 0.12, 1),
    createSpearman(-4.0, 2.5, Math.PI / 2 - 0.12, 1),
    createSpearman(-3.9, 5.1, Math.PI / 2 - 0.12, 1),
    createSpearman(3.9, -0.2, -Math.PI / 2 + 0.12, -1),
    createSpearman(4.0, 2.5, -Math.PI / 2 + 0.12, -1),
    createSpearman(3.9, 5.1, -Math.PI / 2 + 0.12, -1)
  ];

  // West Archive Room Informant — Dedicated Realistic Maid facing cleanly into the room
  createMaid(-9.8, 0, 4.8, 2.35);

  // East Treasury Vigilant Guard (Spearman)


  // South Gatekeeper (Elite Sword Knight facing North toward approaching player)



  return startCastleView({renderer, camera, scene, hero, king, princess, torchFlames, createStoneTexture, canvas, frame});
}
